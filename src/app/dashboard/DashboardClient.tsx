import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Tag,
} from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { getStatusColor, getPriorityColor } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TasksTrendChart } from "@/components/dashboard/TasksTrendChart";
import { TasksByStatusChart } from "@/components/dashboard/TasksByStatusChart";

const cardSurface =
  "bg-white ring-0 border border-border shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:bg-card dark:hover:border-gray-700";

export type DashboardClientProps = {
  lang: string;
  firstName: string;
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    overallProgress: number;
    memberCount: number;
    activeProjectsTrend?: string;
  };
  tasksTrendData: { date: string; count: number }[];
  statusChartData: { status: string; count: number }[];
  recentTasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    project: { id: string; name: string; color: string };
  }[];
  recentProjects: {
    id: string;
    name: string;
    color: string;
    _count: { tasks: number; members: number };
  }[];
  topLabels: {
    id: string;
    name: string;
    color: string;
    _count: { taskLabels: number };
  }[];
};

export function DashboardClient({
  lang,
  firstName,
  stats,
  tasksTrendData,
  statusChartData,
  recentTasks,
  recentProjects,
  topLabels,
}: DashboardClientProps) {
  const t = getTranslation(lang);
  const remaining = stats.totalTasks - stats.doneTasks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {(t("dashboard.welcome") || "Xoş gəlmisiniz, {name}! 👋").replace(
            "{name}",
            firstName
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard.subtitle") ||
            "Bugünkü iş vəziyyətinizə və statistikalarınıza nəzər yetirin."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("dashboard.activeProjects") || "Aktiv Layihələr"}
          value={stats.activeProjects}
          subtext={(t("dashboard.fromProjects") || "{total} layihədən").replace(
            "{total}",
            String(stats.totalProjects)
          )}
          icon={FolderKanban}
          iconClass="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          trend={stats.activeProjectsTrend}
          href="/dashboard/projects"
        />
        <StatCard
          title={t("dashboard.completedTasks") || "Tamamlanan Tapşırıqlar"}
          value={stats.doneTasks}
          subtext={(t("dashboard.fromTasks") || "{total} tapşırıqdan").replace(
            "{total}",
            String(stats.totalTasks)
          )}
          icon={CheckCircle2}
          iconClass="bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400"
          trend={(t("dashboard.percentCompleted") || "{percentage}% tamamlanıb").replace(
            "{percentage}",
            String(stats.overallProgress)
          )}
          href="/dashboard/my-work/tasks"
        />
        <StatCard
          title={t("dashboard.inProgress") || "Davam edən"}
          value={stats.inProgressTasks}
          subtext={t("dashboard.taskActive") || "tapşırıq aktivdir"}
          icon={Clock}
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
          href="/dashboard/my-work/tasks"
        />
        <StatCard
          title={t("dashboard.teamMembers") || "Komanda Üzvləri"}
          value={stats.memberCount}
          subtext={t("dashboard.activeMembers") || "sistemdəki aktiv üzv"}
          icon={Users}
          iconClass="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
          href="/dashboard/members"
        />
      </div>

      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            {t("dashboard.overallProgress") || "Ümumi İcra Faizi"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold tracking-tight">
              {stats.overallProgress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/80 transition-all duration-700"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              {(t("dashboard.completedCount") || "{count} tamamlandı").replace(
                "{count}",
                String(stats.doneTasks)
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {(t("dashboard.remainingCount") || "{count} qalır").replace(
                "{count}",
                String(remaining)
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className={cardSurface}>
          <CardHeader>
            <CardTitle>
              {t("dashboard.last14DaysTasks") || "Son 14 Gün — Tamamlanan Tapşırıqlar"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TasksTrendChart data={tasksTrendData} />
          </CardContent>
        </Card>

        <Card className={`${cardSurface} flex flex-col`}>
          <CardHeader>
            <CardTitle>{t("dashboard.tasksByStatus") || "Statusa görə Tapşırıqlar"}</CardTitle>
            <CardDescription>
              {t("dashboard.tasksByStatusDesc") ||
                "Şirkət üzrə bütün tapşırıqların cari bölgüsü"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center">
            <TasksByStatusChart data={statusChartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className={cardSurface}>
          <CardHeader>
            <CardTitle>{t("dashboard.recentTasks") || "Son Tapşırıqlar"}</CardTitle>
            <CardAction>
              <Link
                href="/dashboard/my-work/tasks"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                {t("dashboard.viewAll") || "Hamısı"}
                <ArrowRight className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <EmptyState icon={AlertCircle} message={t("dashboard.noTasks") || "Hələ tapşırıq yoxdur"} />
            ) : (
              <ul className="flex flex-col gap-1">
                {recentTasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/dashboard/projects/${task.project.id}`}
                      className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <div
                        className="mt-1.5 size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: task.project.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {task.project.name}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-medium uppercase ${getStatusColor(task.status)}`}
                          >
                            {statusLabel(task.status, t)}
                          </span>
                          <span
                            className={`inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-medium uppercase ${getPriorityColor(task.priority)}`}
                          >
                            {priorityLabel(task.priority, t)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={cardSurface}>
          <CardHeader>
            <CardTitle>{t("dashboard.recentProjects") || "Son Layihələr"}</CardTitle>
            <CardAction>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                {t("dashboard.viewAll") || "Hamısı"}
                <ArrowRight className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <EmptyState icon={AlertCircle} message={t("dashboard.noProjects") || "Hələ layihə yoxdur"} />
            ) : (
              <ul className="flex flex-col gap-1">
                {recentProjects.map((proj) => (
                  <li key={proj.id}>
                    <Link
                      href={`/dashboard/projects/${proj.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: proj.color }}
                      >
                        {proj.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {proj.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {(t("dashboard.taskCount") || "{count} tapşırıq").replace(
                            "{count}",
                            String(proj._count.tasks)
                          )}
                          {" · "}
                          {(t("dashboard.memberCount") || "{count} üzv").replace(
                            "{count}",
                            String(proj._count.members)
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={cardSurface}>
          <CardHeader>
            <CardTitle>{t("dashboard.topLabels") || "Populyar Etiketlər"}</CardTitle>
          </CardHeader>
          <CardContent>
            {topLabels.length === 0 ? (
              <EmptyState icon={Tag} message={t("dashboard.noLabels") || "Hələ etiket yoxdur"} />
            ) : (
              <ul className="flex flex-col gap-2">
                {topLabels.map((label) => (
                  <li
                    key={label.id}
                    className="flex items-center justify-between rounded-lg border border-transparent px-2 py-2 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        <Tag className="size-3.5" />
                      </div>
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {label.name}
                      </span>
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {(t("dashboard.taskCount") || "{count} tapşırıq").replace(
                        "{count}",
                        String(label._count.taskLabels)
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconClass,
  trend,
  href,
}: {
  title: string;
  value: number;
  subtext: string;
  icon: LucideIcon;
  iconClass: string;
  trend?: string;
  href: string;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className={`h-full ${cardSurface}`}>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`shrink-0 rounded-full p-2 ${iconClass}`}>
            <Icon className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
          {trend && (
            <p className="mt-3 inline-flex items-center gap-1.5 border-t border-border pt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3.5" />
              {trend}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-muted-foreground">
      <Icon className="size-8 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function statusLabel(s: string, t: (k: string) => string) {
  const translated = t(`status.${s}`);
  if (translated && translated !== `status.${s}`) return translated;
  const map: Record<string, string> = {
    BACKLOG: "Növbəti",
    TODO: "Gözləyir",
    IN_PROGRESS: "Davam edir",
    IN_REVIEW: "Nəzərdən keç.",
    DONE: "Tamamlandı",
    CANCELLED: "Ləğv edildi",
  };
  return map[s] ?? s;
}

function priorityLabel(p: string, t: (k: string) => string) {
  const translated = t(`priority.${p}`);
  if (translated && translated !== `priority.${p}`) return translated;
  const map: Record<string, string> = {
    LOW: "Aşağı",
    MEDIUM: "Orta",
    HIGH: "Yüksək",
    URGENT: "Təcili",
  };
  return map[p] ?? p;
}
