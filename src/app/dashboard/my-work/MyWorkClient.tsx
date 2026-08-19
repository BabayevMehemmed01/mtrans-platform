"use client";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTranslation } from "@/lib/i18n";
import { cn, getInitials, getPriorityColor } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  FolderKanban,
  Users,
  Flag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { MyWorkTrendChart } from "@/components/dashboard/MyWorkTrendChart";
import { WorkCalendar, type CalendarTaskItem } from "@/components/dashboard/WorkCalendar";

const MY_WORK_QUERY_KEY = ["my-work"] as const;

const cardSurface =
  "bg-white ring-0 border border-border shadow-none hover:shadow-md transition-all duration-200 dark:bg-card";

const statusBadgeClass: Record<string, string> = {
  BACKLOG: "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  TODO: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  IN_REVIEW: "border-transparent bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  DONE: "border-transparent bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  CANCELLED: "border-transparent bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

type Translate = (key: string) => string;

type Assignee = { id: string; name: string; avatar?: string | null };

type MyWorkTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; color: string };
  labels?: { label: { id: string; name: string; color: string } }[];
  assignee?: Assignee | null;
};

type MyWorkData = {
  tasks: MyWorkTask[];
  recentComments: any[];
  stats: { overdue: number; upcoming: number; total: number; completed: number };
  weeklyCompleted: { date: string; count: number }[];
  department: {
    id: string;
    name: string;
    color: string;
    _count?: { users: number; projects: number };
  } | null;
  projects: any[];
};

async function fetchMyWork(): Promise<MyWorkData> {
  const res = await fetch("/api/my-work");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function statusLabels(t: Translate): Record<string, string> {
  return {
    BACKLOG: t("status.BACKLOG") || "Növbəti",
    TODO: t("status.TODO") || "Gözləyir",
    IN_PROGRESS: t("status.IN_PROGRESS") || "Davam edir",
    IN_REVIEW: t("status.IN_REVIEW") || "Yoxlanışda",
    DONE: t("status.DONE") || "Tamamlandı",
    CANCELLED: t("status.CANCELLED") || "Ləğv edildi",
  };
}

function priorityLabel(priority: string, t: Translate) {
  const translated = t(`priority.${priority}`);
  if (translated && translated !== `priority.${priority}`) return translated;
  const map: Record<string, string> = {
    LOW: "Aşağı",
    MEDIUM: "Orta",
    HIGH: "Yüksək",
    URGENT: "Təcili",
  };
  return map[priority] ?? priority;
}

function TaskCard({
  task,
  onStatusChange,
  t,
  fallbackAssignee,
}: {
  task: MyWorkTask;
  onStatusChange: (taskId: string, status: string) => void;
  t: Translate;
  fallbackAssignee?: Assignee | null;
}) {
  const isOverdue =
    Boolean(task.dueDate) &&
    new Date(task.dueDate!) < new Date() &&
    task.status !== "DONE" &&
    task.status !== "CANCELLED";
  const labels = statusLabels(t);
  const assignee = task.assignee ?? fallbackAssignee ?? null;

  return (
    <Card className={cn(cardSurface, "h-full")}>
      <CardHeader className="gap-3 p-6 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {task.project.name}
            </p>
            <Link
              href={`/dashboard/projects/${task.project.id}?task=${task.id}`}
              className="mt-1 block truncate text-sm font-medium hover:underline"
            >
              {task.title}
            </Link>
          </div>
          <Badge className={cn("shrink-0", statusBadgeClass[task.status])}>
            {labels[task.status] ?? task.status}
          </Badge>
        </div>
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.labels.map((tl) => (
              <Badge
                key={tl.label.id}
                variant="outline"
                className="h-5 text-[10px]"
                style={{ borderColor: tl.label.color, color: tl.label.color }}
              >
                {tl.label.name}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-6 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("gap-1 border", getPriorityColor(task.priority))}>
            <Flag className="size-3" />
            {priorityLabel(task.priority, t)}
          </Badge>
          {task.dueDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}
            >
              <Calendar className="size-3.5" />
              {format(new Date(task.dueDate), "dd MMM yyyy")}
              {isOverdue && (
                <Badge variant="destructive" className="h-5">
                  {t("myWork.overdueBadge") || "Gecikir"}
                </Badge>
              )}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-7">
              <AvatarImage src={assignee?.avatar ?? undefined} alt={assignee?.name ?? ""} />
              <AvatarFallback className="text-[10px]">
                {getInitials(assignee?.name || "US")}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">
              {assignee?.name ?? "—"}
            </span>
          </div>
          <Select value={task.status} onValueChange={(val) => onStatusChange(task.id, String(val))}>
            <SelectTrigger
              size="sm"
              className={cn("h-8 w-[8.5rem] border-0 text-xs font-medium", statusBadgeClass[task.status])}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(labels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskGrid({
  tasks,
  empty,
  onStatusChange,
  t,
  fallbackAssignee,
}: {
  tasks: MyWorkTask[];
  empty: string;
  onStatusChange: (taskId: string, status: string) => void;
  t: Translate;
  fallbackAssignee?: Assignee | null;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          t={t}
          fallbackAssignee={fallbackAssignee}
        />
      ))}
    </div>
  );
}

function MyWorkSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className={cn(cardSurface, "hover:shadow-none")}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="size-10 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className={cn(cardSurface, "lg:col-span-2 hover:shadow-none")}>
          <CardHeader className="p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className={cn(cardSurface, "hover:shadow-none")}>
          <CardHeader className="p-6">
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-0">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
      <Card className={cn(cardSurface, "hover:shadow-none")}>
        <CardHeader className="p-6">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MyWorkClient({ currentUser }: { currentUser: any }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  const view = searchParams.get("view");
  const tabValue =
    view === "archive" ? "completed" : view === "approvals" ? "approvals" : "active";

  const fallbackAssignee: Assignee | null = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.name ?? "",
        avatar: currentUser.image ?? currentUser.avatar ?? null,
      }
    : null;

  const { data, isPending, isError } = useQuery({
    queryKey: MY_WORK_QUERY_KEY,
    queryFn: fetchMyWork,
    refetchInterval: 10_000,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const res = await fetch("/api/my-work", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: MY_WORK_QUERY_KEY });
      const previous = queryClient.getQueryData<MyWorkData>(MY_WORK_QUERY_KEY);
      queryClient.setQueryData<MyWorkData>(MY_WORK_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((task) =>
            task.id === taskId ? { ...task, status } : task
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(MY_WORK_QUERY_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MY_WORK_QUERY_KEY });
    },
  });

  const handleStatusChange = (taskId: string, status: string) => {
    statusMutation.mutate({ taskId, status });
  };

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {t("myWork.fetchError") || "Məlumatları yükləyərkən xəta baş verdi."}
      </div>
    );
  }

  if (isPending || !data) {
    return <MyWorkSkeleton />;
  }

  const { tasks, recentComments, stats, weeklyCompleted, department, projects } = data;

  const activeTasks = tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED");
  const approvalTasks = tasks.filter((task) => task.status === "IN_REVIEW");
  const completedTasks = tasks.filter((task) => task.status === "DONE" || task.status === "CANCELLED");

  const calendarTasks: CalendarTaskItem[] = tasks
    .filter((task) => task.dueDate)
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      status: task.status,
      href: `/dashboard/projects/${task.project.id}?task=${task.id}`,
      meta: task.project.name,
    }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className={cardSurface}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">{t("myWork.totalTasks") || "Cəmi Tapşırıq"}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.total}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
              <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={cardSurface}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">{t("myWork.completed") || "Tamamlanan"}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">{stats.completed}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={cardSurface}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">{t("myWork.upcoming") || "Yaxınlaşan (3 gün)"}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-600">{stats.upcoming}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
              <Clock className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(cardSurface, stats.overdue > 0 && "border-red-200 dark:border-red-900/50")}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">{t("myWork.overdue") || "Gecikən"}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600">{stats.overdue}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className={cn(cardSurface, "lg:col-span-2")}>
          <CardHeader className="p-6 pb-3">
            <CardTitle>{t("myWork.calendar") || "Təqvim"}</CardTitle>
            <CardDescription>
              {t("myWork.calendarDesc") || "Tamamlanmış (yaşıl) və gözləyən (narıncı) tapşırıqlarınızın tarixləri."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <WorkCalendar tasks={calendarTasks} />
          </CardContent>
        </Card>

        <Card className={cardSurface}>
          <CardHeader className="p-6 pb-3">
            <CardTitle>{t("myWork.activity") || "Aktivlik"}</CardTitle>
            <CardDescription>
              {t("myWork.activityDesc") || "Daxil olduğunuz şöbə və layihələr."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-6 pt-0">
            {department && (
              <Link
                href={`/dashboard/departments/${department.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all hover:bg-muted/60"
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${department.color}20`, color: department.color }}
                >
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{department.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    {(t("myWork.workers") || "{count} işçi").replace(
                      "{count}",
                      String(department._count?.users ?? 0)
                    )}{" "}
                    ·{" "}
                    {(t("myWork.projects") || "{count} layihə").replace(
                      "{count}",
                      String(department._count?.projects ?? 0)
                    )}
                  </p>
                </div>
              </Link>
            )}

            {projects.length === 0 && !department && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("myWork.noDepartment") || "Hələ heç bir şöbə və ya layihəyə daxil deyilsiniz."}
              </p>
            )}

            {projects.map((project: any) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all hover:bg-muted/60"
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${project.color}20`, color: project.color }}
                >
                  <FolderKanban className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`projectStatus.${project.status}`) || project.status} ·{" "}
                    {(t("myWork.tasksCount") || "{count} tapşırıq").replace(
                      "{count}",
                      String(project._count?.tasks ?? 0)
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className={cardSurface}>
        <CardHeader className="p-6 pb-3">
          <CardTitle>{t("myWork.weeklyTrend") || "Son 7 Gün — Tamamladığım Tapşırıqlar"}</CardTitle>
          <CardDescription>
            {t("myWork.weeklyTrendDesc") || "Gün üzrə tamamladığınız tapşırıqların sayı."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <MyWorkTrendChart data={weeklyCompleted ?? []} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className={cn(cardSurface, "lg:col-span-2")}>
          <CardHeader className="p-6 pb-3">
            <CardTitle>{t("myWork.tasks") || "Tapşırıqlar"}</CardTitle>
            <CardDescription>
              {t("myWork.tasksDesc") || "Sizə təyin edilmiş bütün tapşırıqlar — statusa görə."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Tabs key={tabValue} defaultValue={tabValue} className="gap-4">
              <TabsList>
                <TabsTrigger value="active">
                  {t("myWork.tabActive") || "Aktiv"} ({activeTasks.length})
                </TabsTrigger>
                <TabsTrigger value="approvals">
                  {t("menu.myWorkApprovals") || "Təsdiq Gözləyənlər"} ({approvalTasks.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  {t("menu.myWorkArchive") || t("myWork.tabCompleted") || "Arxiv"} ({completedTasks.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  {t("myWork.tabAll") || "Hamısı"} ({tasks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <TaskGrid
                  tasks={activeTasks}
                  empty={t("myWork.allDone") || "Bütün işləri bitirmisiniz! 🎉"}
                  onStatusChange={handleStatusChange}
                  t={t}
                  fallbackAssignee={fallbackAssignee}
                />
              </TabsContent>
              <TabsContent value="approvals">
                <TaskGrid
                  tasks={approvalTasks}
                  empty={t("myWork.noTasks") || "Sizə hələ tapşırıq təyin edilməyib."}
                  onStatusChange={handleStatusChange}
                  t={t}
                  fallbackAssignee={fallbackAssignee}
                />
              </TabsContent>
              <TabsContent value="completed">
                <TaskGrid
                  tasks={completedTasks}
                  empty={t("myWork.noCompleted") || "Hələ tamamlanmış tapşırıq yoxdur."}
                  onStatusChange={handleStatusChange}
                  t={t}
                  fallbackAssignee={fallbackAssignee}
                />
              </TabsContent>
              <TabsContent value="all">
                <TaskGrid
                  tasks={tasks}
                  empty={t("myWork.noTasks") || "Sizə hələ tapşırıq təyin edilməyib."}
                  onStatusChange={handleStatusChange}
                  t={t}
                  fallbackAssignee={fallbackAssignee}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className={cardSurface}>
          <CardHeader className="p-6 pb-3">
            <CardTitle>{t("myWork.recentComments") || "Son Rəylər"}</CardTitle>
            <CardDescription>
              {t("myWork.commentsDesc") || "Sizin tapşırıqlara yazılan şərhlər."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ScrollArea className="h-[500px]">
              {recentComments.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {t("myWork.noComments") || "Yaxın zamanda rəy yoxdur."}
                </p>
              ) : (
                <div className="flex flex-col gap-3 pr-3">
                  {recentComments.map((comment: any) => (
                    <Link
                      key={comment.id}
                      href={`/dashboard/projects/${comment.task.projectId ?? ""}?task=${comment.task.id}`}
                      className="block rounded-lg border border-border p-4 transition-all hover:bg-muted/60"
                    >
                      <div className="flex gap-3">
                        <Avatar className="mt-0.5 size-8">
                          <AvatarImage src={comment.author.avatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium">{comment.author.name}</span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {format(new Date(comment.createdAt), "dd MMM, HH:mm")}
                            </span>
                          </div>
                          <p className="mb-1 truncate text-xs text-muted-foreground">
                            {(t("myWork.taskLabel") || "Tapşırıq: {title}").replace(
                              "{title}",
                              comment.task.title
                            )}
                          </p>
                          <div className="rounded-md border border-border bg-muted/40 p-2 text-sm">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
