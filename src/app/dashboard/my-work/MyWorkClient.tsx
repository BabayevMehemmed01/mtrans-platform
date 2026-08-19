"use client";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTranslation } from "@/lib/i18n";
import { cn, getPriorityColor } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  FolderKanban,
  Users,
  List,
  LayoutGrid,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  "bg-white ring-0 border border-border shadow-sm hover:shadow-md transition-all duration-200 dark:bg-card";

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

function TaskRow({
  task,
  onStatusChange,
  t,
}: {
  task: MyWorkTask;
  onStatusChange: (taskId: string, status: string) => void;
  t: Translate;
}) {
  const isOverdue =
    Boolean(task.dueDate) &&
    new Date(task.dueDate!) < new Date() &&
    task.status !== "DONE" &&
    task.status !== "CANCELLED";
  const labels = statusLabels(t);

  return (
    <div className="group grid grid-cols-1 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-border hover:bg-gray-100 dark:hover:bg-gray-800/60 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_8.5rem_7.5rem]">
      <div className="min-w-0">
        <Link
          href={`/dashboard/projects/${task.project.id}?task=${task.id}`}
          className="block truncate text-sm font-medium text-foreground transition-colors hover:text-blue-600"
        >
          {task.title}
        </Link>
        {task.labels && task.labels.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {task.labels.slice(0, 3).map((tl) => (
              <Badge
                key={tl.label.id}
                variant="outline"
                className="h-4 text-[10px]"
                style={{ borderColor: tl.label.color, color: tl.label.color }}
              >
                {tl.label.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Badge className={cn("w-fit shrink-0", statusBadgeClass[task.status])}>
        {labels[task.status] ?? task.status}
      </Badge>

      <Badge variant="outline" className={cn("w-fit shrink-0 border", getPriorityColor(task.priority))}>
        {priorityLabel(task.priority, t)}
      </Badge>

      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs tabular-nums",
          isOverdue ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"
        )}
      >
        <Calendar className="size-3.5" />
        {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy") : "—"}
        {isOverdue && (
          <span className="text-[10px] font-medium">
            {t("myWork.overdueBadge") || "Gecikir"}
          </span>
        )}
      </span>

      <Link
        href={`/dashboard/projects/${task.project.id}`}
        className="flex min-w-0 items-center justify-end gap-2 text-right text-xs text-muted-foreground transition-colors hover:text-foreground"
        title={task.project.name}
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: task.project.color }}
        />
        <span className="truncate">{task.project.name}</span>
      </Link>

      <Select value={task.status} onValueChange={(val) => onStatusChange(task.id, String(val))}>
        <SelectTrigger
          size="sm"
          className={cn("h-8 w-full border-0 text-xs font-medium", statusBadgeClass[task.status])}
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
  );
}

function TaskList({
  tasks,
  empty,
  onStatusChange,
  t,
}: {
  tasks: MyWorkTask[];
  empty: string;
  onStatusChange: (taskId: string, status: string) => void;
  t: Translate;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-white dark:bg-card">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} t={t} />
      ))}
    </div>
  );
}

function MyWorkSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-72 rounded-md" />
      <Skeleton className="h-80 w-full rounded-xl" />
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
  const filterValue =
    view === "archive" ? "completed" : view === "approvals" ? "approvals" : "active";

  void currentUser;

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

  const { tasks, stats, weeklyCompleted, department, projects } = data;

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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className={cardSurface}>
          <CardContent className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40">
              <LayoutGrid className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">
                {t("myWork.totalTasks") || "Cəmi Tapşırıq"}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-tight">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cardSurface}>
          <CardContent className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/40">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">
                {t("myWork.completed") || "Tamamlanan"}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-tight text-emerald-600">
                {stats.completed}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={cardSurface}>
          <CardContent className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/40">
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">
                {t("myWork.upcoming") || "Yaxınlaşan (3 gün)"}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-tight text-amber-600">
                {stats.upcoming}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(cardSurface, stats.overdue > 0 && "border-red-200 dark:border-red-900/50")}>
          <CardContent className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-red-50 dark:bg-red-950/40">
              <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">
                {t("myWork.overdue") || "Gecikən"}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-tight text-red-600">
                {stats.overdue}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="gap-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-1.5">
            <List className="size-3.5" />
            {t("myWork.tasks")}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <Calendar className="size-3.5" />
            {t("myWork.calendar")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <Card className={cn(cardSurface, "hover:shadow-sm")}>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm">{t("myWork.tasks") || "Tapşırıqlar"}</CardTitle>
              <CardDescription>
                {t("myWork.tasksDesc") || "Sizə təyin edilmiş bütün tapşırıqlar — statusa görə."}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Tabs key={filterValue} defaultValue={filterValue} className="gap-3">
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
                  <TaskList
                    tasks={activeTasks}
                    empty={t("myWork.allDone") || "Bütün işləri bitirmisiniz! 🎉"}
                    onStatusChange={handleStatusChange}
                    t={t}
                  />
                </TabsContent>
                <TabsContent value="approvals">
                  <TaskList
                    tasks={approvalTasks}
                    empty={t("myWork.noTasks") || "Sizə hələ tapşırıq təyin edilməyib."}
                    onStatusChange={handleStatusChange}
                    t={t}
                  />
                </TabsContent>
                <TabsContent value="completed">
                  <TaskList
                    tasks={completedTasks}
                    empty={t("myWork.noCompleted") || "Hələ tamamlanmış tapşırıq yoxdur."}
                    onStatusChange={handleStatusChange}
                    t={t}
                  />
                </TabsContent>
                <TabsContent value="all">
                  <TaskList
                    tasks={tasks}
                    empty={t("myWork.noTasks") || "Sizə hələ tapşırıq təyin edilməyib."}
                    onStatusChange={handleStatusChange}
                    t={t}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className={cn(cardSurface, "lg:col-span-2 hover:shadow-sm")}>
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm">{t("myWork.calendar") || "Təqvim"}</CardTitle>
                <CardDescription>
                  {t("myWork.calendarDesc") ||
                    "Tamamlanmış (yaşıl) və gözləyən (narıncı) tapşırıqlarınızın tarixləri."}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <WorkCalendar tasks={calendarTasks} />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className={cn(cardSurface, "hover:shadow-sm")}>
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-sm">{t("myWork.activity") || "Aktivlik"}</CardTitle>
                  <CardDescription>
                    {t("myWork.activityDesc") || "Daxil olduğunuz şöbə və layihələr."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 px-4 pb-4">
                  {department && (
                    <Link
                      href={`/dashboard/departments/${department.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all hover:bg-gray-100 dark:hover:bg-gray-800/60"
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${department.color}20`, color: department.color }}
                      >
                        <Building2 className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{department.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" />
                          {(t("myWork.workers") || "{count} işçi").replace(
                            "{count}",
                            String(department._count?.users ?? 0)
                          )}
                        </p>
                      </div>
                    </Link>
                  )}
                  {projects.length === 0 && !department && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t("myWork.noDepartment") || "Hələ heç bir şöbə və ya layihəyə daxil deyilsiniz."}
                    </p>
                  )}
                  {projects.map((project: any) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all hover:bg-gray-100 dark:hover:bg-gray-800/60"
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                        <FolderKanban className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`projectStatus.${project.status}`) || project.status}
                        </p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card className={cn(cardSurface, "hover:shadow-sm")}>
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-sm">
                    {t("myWork.weeklyTrend") || "Son 7 Gün — Tamamladığım Tapşırıqlar"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <MyWorkTrendChart data={weeklyCompleted ?? []} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
