import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Tag,
  Activity,
} from "lucide-react";
import { getStatusColor, getPriorityColor, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { TasksTrendChart } from "@/components/dashboard/TasksTrendChart";
import { TasksByStatusChart } from "@/components/dashboard/TasksByStatusChart";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";

const TREND_DAYS = 14;
const STATUS_ORDER = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

export const metadata: Metadata = { title: "Ana Səhifə" };

// =============================================================================
// Dashboard Overview Page — Server Component
// =============================================================================
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // --- Tarix aralıqları ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trendStartDate = new Date(today);
  trendStartDate.setDate(trendStartDate.getDate() - (TREND_DAYS - 1));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // --- Paralel data fetching ---
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
    // Layihə statistikaları
    prisma.project.groupBy({
      by: ["status"],
      where: { companyId, isArchived: false },
      _count: true,
    }),
    // Tapşırıq statistikaları
    prisma.task.groupBy({
      by: ["status"],
      where: { project: { companyId } },
      _count: true,
    }),
    // Üzv sayı
    prisma.user.count({ where: { companyId } }),
    // Son 5 tapşırıq
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
    // Son 4 layihə
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
    // Etiketlər (Recent)
    prisma.label.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { taskLabels: true } } }
    }),
    // Son 14 gündə tamamlanan tapşırıqlar (trend qrafiki üçün)
    prisma.task.findMany({
      where: {
        project: { companyId },
        completedAt: { gte: trendStartDate },
      },
      select: { completedAt: true },
    }),
    // Son fəaliyyət qeydləri (Audit Log)
    prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, avatar: true } } },
    }),
    // Bu ay yaradılan layihələr (real trend üçün)
    prisma.project.count({
      where: { companyId, isArchived: false, createdAt: { gte: monthStart } },
    }),
  ]);

  // --- Stats hesablamaları ---
  const totalProjects = projectStats.reduce((sum, s) => sum + s._count, 0);
  const activeProjects =
    projectStats.find((s) => s.status === "ACTIVE")?._count ?? 0;

  const totalTasks = taskStats.reduce((sum, s) => sum + s._count, 0);
  const doneTasks = taskStats.find((s) => s.status === "DONE")?._count ?? 0;
  const inProgressTasks =
    taskStats.find((s) => s.status === "IN_PROGRESS")?._count ?? 0;
  const overallProgress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Aktiv Layihələr kartı üçün real trend (fake "+2 bu ay" əvəzinə)
  const activeProjectsTrend =
    projectsThisMonth > 0 ? `+${projectsThisMonth} bu ay` : undefined;

  // --- Son 14 gün üzrə tamamlanan tapşırıq trendi (gündəlik bucket-lar) ---
  const tasksTrendData = (() => {
    const buckets = new Map<string, number>();
    for (let i = 0; i < TREND_DAYS; i++) {
      const d = new Date(trendStartDate);
      d.setDate(d.getDate() + i);
      buckets.set(format(d, "dd.MM"), 0);
    }
    for (const t of completedTasksRaw) {
      if (!t.completedAt) continue;
      const key = format(t.completedAt, "dd.MM");
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets, ([date, count]) => ({ date, count }));
  })();

  // --- Statusa görə tapşırıq sayları (bütün statuslar, 0 daxil olmaqla) ---
  const statusChartData = STATUS_ORDER.map((status) => ({
    status,
    count: taskStats.find((s) => s.status === status)?._count ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Xoş gəlmisiniz, {session.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1 text-sm">
          Bugünkü iş vəziyyətinizə baxın
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Aktiv Layihələr"
          value={activeProjects}
          subtext={`${totalProjects} layihədən`}
          icon={FolderKanban}
          iconColor="bg-blue-500/10 text-blue-600"
          trend={activeProjectsTrend}
        />
        <StatCard
          title="Tamamlanan Tapşırıqlar"
          value={doneTasks}
          subtext={`${totalTasks} tapşırıqdan`}
          icon={CheckCircle2}
          iconColor="bg-green-500/10 text-green-600"
          trend={`${overallProgress}% tamamlanıb`}
        />
        <StatCard
          title="Davam edən"
          value={inProgressTasks}
          subtext="tapşırıq aktiv"
          icon={Clock}
          iconColor="bg-yellow-500/10 text-yellow-600"
        />
        <StatCard
          title="Komanda Üzvləri"
          value={memberCount}
          subtext="aktiv üzv"
          icon={Users}
          iconColor="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span className="text-sm font-semibold">Ümumi İcra Faizi</span>
          </div>
          <span className="text-2xl font-bold text-[hsl(var(--primary))]">
            {overallProgress}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mt-2">
          <span>{doneTasks} tamamlandı</span>
          <span>{totalTasks - doneTasks} qalır</span>
        </div>
      </div>

      {/* Charts Row: Tasks Trend + Tasks by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h2 className="text-sm font-semibold mb-4">
            Son 14 Gün — Tamamlanan Tapşırıqlar
          </h2>
          <TasksTrendChart data={tasksTrendData} />
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h2 className="text-sm font-semibold mb-4">Statusa görə Tapşırıqlar</h2>
          <TasksByStatusChart data={statusChartData} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h2 className="text-sm font-semibold">Son Fəaliyyət</h2>
        </div>
        <RecentActivityFeed logs={recentActivity} />
      </div>

      {/* Bottom Grid: Recent Tasks + Recent Projects + Top Labels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tasks */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Son Tapşırıqlar</h2>
            <Link
              href="/dashboard/projects"
              className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
            >
              Hamısı <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <EmptyState icon={AlertCircle} message="Hələ tapşırıq yoxdur" />
          ) : (
            <ul className="divide-y divide-[hsl(var(--border))]">
              {recentTasks.map((task) => (
                <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    {/* Project color dot */}
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: task.project.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/projects/${task.project.id}`}
                        className="text-xs text-[hsl(var(--muted-foreground))] hover:underline truncate block"
                      >
                        {task.project.name}
                      </Link>
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}
                        >
                          {statusLabel(task.status)}
                        </span>
                        <span
                          className={`text-xs font-medium ${getPriorityColor(task.priority)}`}
                        >
                          {priorityLabel(task.priority)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                      {timeAgo(task.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Projects */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Son Layihələr</h2>
            <Link
              href="/dashboard/projects"
              className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
            >
              Hamısı <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyState icon={AlertCircle} message="Hələ layihə yoxdur" />
          ) : (
            <ul className="space-y-3">
              {recentProjects.map((proj) => (
                <li key={proj.id}>
                  <Link
                    href={`/dashboard/projects/${proj.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: proj.color }}
                    >
                      {proj.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{proj.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {proj._count.tasks} tapşırıq
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {proj._count.members} üzv
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(proj.status)}`}
                    >
                      {projectStatusLabel(proj.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Labels */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Tez-tez İstifadə Olunan Etiketlər</h2>
            <Link
              href="/dashboard/labels"
              className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
            >
              Hamısı <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {topLabels.length === 0 ? (
            <EmptyState icon={Tag} message="Hələ etiket yoxdur" />
          ) : (
            <ul className="space-y-3">
              {topLabels.map((label) => (
                <li key={label.id}>
                  <Link
                    href="/dashboard/labels"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        <Tag className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{label.name}</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-[hsl(var(--muted))] rounded-md text-[hsl(var(--muted-foreground))]">
                      {label._count.taskLabels}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor,
  trend,
}: {
  title: string;
  value: number;
  subtext: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: string;
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
            {title}
          </p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            {subtext}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <p className="text-xs font-medium text-green-600 mt-3">{trend}</p>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-[hsl(var(--muted-foreground))]">
      <Icon className="w-8 h-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// Label helpers
function statusLabel(s: string) {
  const map: Record<string, string> = {
    BACKLOG: "Növbəti", TODO: "Gözləyir", IN_PROGRESS: "Davam edir",
    IN_REVIEW: "Nəzərdən keçirilir", DONE: "Tamamlandı", CANCELLED: "Ləğv edildi",
  };
  return map[s] ?? s;
}
function priorityLabel(p: string) {
  const map: Record<string, string> = {
    LOW: "Aşağı", MEDIUM: "Orta", HIGH: "Yüksək", URGENT: "Təcili",
  };
  return map[p] ?? p;
}
function projectStatusLabel(s: string) {
  const map: Record<string, string> = {
    PLANNING: "Planlanır", ACTIVE: "Aktiv", ON_HOLD: "Dayandırıldı",
    COMPLETED: "Tamamlandı", CANCELLED: "Ləğv edildi",
  };
  return map[s] ?? s;
}
