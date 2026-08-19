import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getTranslation } from "@/lib/i18n";
import { DashboardClient } from "./DashboardClient";

const TREND_DAYS = 14;
const STATUS_ORDER = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

export const metadata: Metadata = { title: "Ana Səhifə | WorkSpace ERP" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trendStartDate = new Date(today);
  trendStartDate.setDate(trendStartDate.getDate() - (TREND_DAYS - 1));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    projectStats,
    taskStats,
    memberCount,
    recentTasks,
    recentProjects,
    topLabels,
    completedTasksRaw,
    recentActivity,
    projectsThisMonth,
  ] = await Promise.all([
    prisma.project.groupBy({
      by: ["status"],
      where: { companyId, isArchived: false },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { project: { companyId } },
      _count: true,
    }),
    prisma.user.count({ where: { companyId } }),
    prisma.task.findMany({
      where: { project: { companyId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { name: true, avatar: true } },
      },
    }),
    prisma.project.findMany({
      where: { companyId, isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        color: true,
        createdAt: true,
        _count: { select: { tasks: true, members: true } },
      },
    }),
    prisma.label.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { taskLabels: true } } },
    }),
    prisma.task.findMany({
      where: {
        project: { companyId },
        completedAt: { gte: trendStartDate },
      },
      select: { completedAt: true },
    }),
    prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, avatar: true } } },
    }),
    prisma.project.count({
      where: { companyId, isArchived: false, createdAt: { gte: monthStart } },
    }),
  ]);

  const totalProjects = projectStats.reduce((sum, s) => sum + s._count, 0);
  const activeProjects = projectStats.find((s) => s.status === "ACTIVE")?._count ?? 0;
  const totalTasks = taskStats.reduce((sum, s) => sum + s._count, 0);
  const doneTasks = taskStats.find((s) => s.status === "DONE")?._count ?? 0;
  const inProgressTasks = taskStats.find((s) => s.status === "IN_PROGRESS")?._count ?? 0;
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const firstName = session.user.name?.split(" ")[0] || "";
  const activeProjectsTrend =
    projectsThisMonth > 0
      ? (t("dashboard.thisMonth") || "+{count} bu ay").replace(
          "{count}",
          String(projectsThisMonth)
        )
      : undefined;

  const tasksTrendData = (() => {
    const buckets = new Map<string, number>();
    for (let i = 0; i < TREND_DAYS; i++) {
      const d = new Date(trendStartDate);
      d.setDate(d.getDate() + i);
      buckets.set(format(d, "dd.MM"), 0);
    }
    for (const row of completedTasksRaw) {
      if (!row.completedAt) continue;
      const key = format(row.completedAt, "dd.MM");
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets, ([date, count]) => ({ date, count }));
  })();

  const statusChartData = STATUS_ORDER.map((status) => ({
    status,
    count: taskStats.find((s) => s.status === status)?._count ?? 0,
  }));

  return (
    <DashboardClient
      lang={lang}
      firstName={firstName}
      stats={{
        totalProjects,
        activeProjects,
        totalTasks,
        doneTasks,
        inProgressTasks,
        overallProgress,
        memberCount,
        activeProjectsTrend,
      }}
      tasksTrendData={tasksTrendData}
      statusChartData={statusChartData}
      recentActivity={recentActivity}
      recentTasks={recentTasks}
      recentProjects={recentProjects}
      topLabels={topLabels}
    />
  );
}
