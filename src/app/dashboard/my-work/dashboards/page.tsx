import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { TimeSlice } from "@/components/my-work/MyLoggedTimeChart";
import { MyWorkDashboardsClient } from "@/components/my-work/MyWorkDashboardsClient";

const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;

export const metadata = {
  title: "İdarə Panelləri | Mənim İşim | ERP",
};

// =============================================================================
// My Work → Dashboards
// Şəxsi widget-lar: Upcoming Events / Logged Time / Active Tasks progress.
// Yalnız session.user.id-ə aid Task məlumatları üzərindən hesablanır.
// Vidjetlərin göstərilib/gizlədilməsi Kustomizasiya sistemi (User.preferences)
// vasitəsilə idarə olunur — bax: src/hooks/useCustomization.ts
// =============================================================================

export default async function MyWorkDashboardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;

  const [tasks, user] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        isArchived: false,
        ...(companyId ? { project: { companyId } } : {}),
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        actualHours: true,
        estimatedHours: true,
        project: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } }),
  ]);

  const initialPreferences =
    ((user?.preferences as Record<string, Record<string, boolean>> | null)?.["my-work-dashboard"]) ?? {};

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const activeTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const priorityCounts = PRIORITY_ORDER.map((priority) => ({
    priority,
    count: activeTasks.filter((t) => t.priority === priority).length,
  }));
  const maxPriorityCount = Math.max(1, ...priorityCounts.map((p) => p.count));

  const now = new Date();
  const upcomingEvents = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) >= now && t.status !== "DONE" && t.status !== "CANCELLED")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!.toISOString(),
      project: t.project,
    }));

  const timeByProject = new Map<string, TimeSlice>();
  for (const task of tasks) {
    const hours = task.actualHours ?? task.estimatedHours ?? 0;
    if (!hours) continue;
    const existing = timeByProject.get(task.project.id) ?? {
      name: task.project.name,
      color: task.project.color,
      value: 0,
    };
    existing.value += hours;
    timeByProject.set(task.project.id, existing);
  }

  return (
    <MyWorkDashboardsClient
      initialPreferences={initialPreferences}
      upcomingEvents={upcomingEvents}
      timeData={Array.from(timeByProject.values())}
      total={total}
      done={done}
      progressPct={progressPct}
      priorityCounts={priorityCounts}
      maxPriorityCount={maxPriorityCount}
      activeTaskCount={activeTasks.length}
    />
  );
}
