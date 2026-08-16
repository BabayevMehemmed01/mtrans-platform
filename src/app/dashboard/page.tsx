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

export const metadata: Metadata = { title: "Ana Səhifə | WorkSpace ERP" };

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
      include: { _count: { select: { taskLabels: true } } }
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

  // --- Stats hesablamaları ---
  const totalProjects = projectStats.reduce((sum, s) => sum + s._count, 0);
  const activeProjects = projectStats.find((s) => s.status === "ACTIVE")?._count ?? 0;

  const totalTasks = taskStats.reduce((sum, s) => sum + s._count, 0);
  const doneTasks = taskStats.find((s) => s.status === "DONE")?._count ?? 0;
  const inProgressTasks = taskStats.find((s) => s.status === "IN_PROGRESS")?._count ?? 0;
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const activeProjectsTrend = projectsThisMonth > 0 ? `+${projectsThisMonth} bu ay` : undefined;

  // --- Son 14 gün üzrə tamamlanan tapşırıq trendi ---
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

  // --- Statusa görə tapşırıq sayları ---
  const statusChartData = STATUS_ORDER.map((status) => ({
    status,
    count: taskStats.find((s) => s.status === status)?._count ?? 0,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Greeting */}
      <div>
        <h1 className="text-[26px] font-black tracking-tight text-slate-800">
          Xoş gəlmisiniz, {session.user.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-slate-500 font-medium mt-1 text-[15px]">
          Bugünkü iş vəziyyətinizə və statistikalarınıza nəzər yetirin.
        </p>
      </div>

      {/* DİNAMİK KPI CARDS (KLİKLƏNƏ BİLƏN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Aktiv Layihələr"
          value={activeProjects}
          subtext={`${totalProjects} layihədən`}
          icon={FolderKanban}
          iconColor="bg-blue-100 text-blue-600"
          trend={activeProjectsTrend}
          href="/dashboard/projects"
        />
        <StatCard
          title="Tamamlanan Tapşırıqlar"
          value={doneTasks}
          subtext={`${totalTasks} tapşırıqdan`}
          icon={CheckCircle2}
          iconColor="bg-green-100 text-green-600"
          trend={`${overallProgress}% tamamlanıb`}
          href="/dashboard/my-work"
        />
        <StatCard
          title="Davam edən"
          value={inProgressTasks}
          subtext="tapşırıq aktivdir"
          icon={Clock}
          iconColor="bg-amber-100 text-amber-600"
          href="/dashboard/my-work"
        />
        <StatCard
          title="Komanda Üzvləri"
          value={memberCount}
          subtext="sistemdəki aktiv üzv"
          icon={Users}
          iconColor="bg-purple-100 text-purple-600"
          href="/dashboard/members"
        />
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-[15px] font-bold text-slate-800">Ümumi İcra Faizi</span>
          </div>
          <span className="text-3xl font-black text-blue-600">
            {overallProgress}%
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-[13px] font-medium text-slate-500 mt-3">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> {doneTasks} tamamlandı</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> {totalTasks - doneTasks} qalır</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-[16px] font-black text-slate-800 mb-6">
            Son 14 Gün — Tamamlanan Tapşırıqlar
          </h2>
          <TasksTrendChart data={tasksTrendData} />
        </div>
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-[16px] font-black text-slate-800 mb-2">Statusa görə Tapşırıqlar</h2>
          <p className="text-[13px] font-medium text-slate-500 mb-6">Şirkət üzrə bütün tapşırıqların cari bölgüsü</p>
          <div className="flex-1 flex items-center justify-center">
            <TasksByStatusChart data={statusChartData} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h2 className="text-[16px] font-black text-slate-800">Sistemdəki Son Fəaliyyətlər</h2>
        </div>
        <RecentActivityFeed logs={recentActivity} />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tasks */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-black text-slate-800">Son Tapşırıqlar</h2>
            <Link href="/dashboard/my-work" className="text-[12px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
              Hamısı <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <EmptyState icon={AlertCircle} message="Hələ tapşırıq yoxdur" />
          ) : (
            <ul className="space-y-4">
              {recentTasks.map((task) => (
                <li key={task.id} className="group">
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-sm" style={{ backgroundColor: task.project.color }} />
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/projects/${task.project.id}`} className="text-[11px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wider truncate block transition-colors">
                        {task.project.name}
                      </Link>
                      <p className="text-[14px] font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors mt-0.5">{task.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${getStatusColor(task.status)}`}>{statusLabel(task.status)}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityColor(task.priority)}`}>{priorityLabel(task.priority)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Projects */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-black text-slate-800">Son Layihələr</h2>
            <Link href="/dashboard/projects" className="text-[12px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
              Hamısı <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState icon={AlertCircle} message="Hələ layihə yoxdur" />
          ) : (
            <ul className="space-y-3">
              {recentProjects.map((proj) => (
                <li key={proj.id}>
                  <Link href={`/dashboard/projects/${proj.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-gray-200 transition-all group">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-105 transition-transform" style={{ backgroundColor: proj.color }}>
                      {proj.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">{proj.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] font-bold text-slate-400">{proj._count.tasks} tapşırıq</span>
                        <span className="text-[11px] font-bold text-slate-400">{proj._count.members} üzv</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Labels */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-black text-slate-800">Populyar Etiketlər</h2>
          </div>
          {topLabels.length === 0 ? (
            <EmptyState icon={Tag} message="Hələ etiket yoxdur" />
          ) : (
            <ul className="space-y-3">
              {topLabels.map((label) => (
                <li key={label.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: label.color }}>
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700">{label.name}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-white border border-gray-200 rounded-md text-slate-500 shadow-sm">
                    {label._count.taskLabels} tapşırıq
                  </span>
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

function StatCard({ title, value, subtext, icon: Icon, iconColor, trend, href }: { title: string; value: number; subtext: string; icon: React.ElementType; iconColor: string; trend?: string; href?: string; }) {
  const CardContent = (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 h-full flex flex-col justify-between group-hover:border-blue-300 group-hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-black text-slate-800 mt-2 tracking-tight group-hover:text-blue-600 transition-colors">{value}</p>
          <p className="text-[12px] font-semibold text-slate-400 mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-2xl shadow-sm ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <p className="text-[12px] font-bold text-green-600">{trend}</p>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block group h-full cursor-pointer">{CardContent}</Link>
  ) : (
    <div className="block group h-full">{CardContent}</div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string; }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-gray-200">
      <Icon className="w-10 h-10 opacity-50" />
      <p className="text-[13px] font-bold">{message}</p>
    </div>
  );
}

// Label helpers
function statusLabel(s: string) {
  const map: Record<string, string> = {
    BACKLOG: "Növbəti", TODO: "Gözləyir", IN_PROGRESS: "Davam edir",
    IN_REVIEW: "Nəzərdən keç.", DONE: "Tamamlandı", CANCELLED: "Ləğv edildi",
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