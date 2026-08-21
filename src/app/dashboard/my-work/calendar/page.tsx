import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { az } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "My calendar | My Work | ERP",
};

// =============================================================================
// My Work → My calendar
// Həftəlik (Bazar ertəsi—Cümə) təqvim grid-i — yalnız session.user.id-ə aid
// due date-li tapşırıqlar göstərilir.
// =============================================================================

export default async function MyWorkCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;

  const { week } = await searchParams;
  const baseDate = week && !Number.isNaN(new Date(week).getTime()) ? new Date(week) : new Date();
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEndExclusive = addDays(weekStart, 5); // Saturday (exclusive)
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      isArchived: false,
      dueDate: { gte: weekStart, lt: weekEndExclusive },
      ...(companyId ? { project: { companyId } } : {}),
    },
    include: { project: { select: { id: true, name: true, color: true } } },
    orderBy: { dueDate: "asc" },
  });

  const tasksByDay = new Map<string, typeof tasks>();
  for (const task of tasks) {
    const key = format(new Date(task.dueDate!), "yyyy-MM-dd");
    const list = tasksByDay.get(key) ?? [];
    list.push(task);
    tasksByDay.set(key, list);
  }

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const prevWeekHref = `/dashboard/my-work/calendar?week=${format(addWeeks(weekStart, -1), "yyyy-MM-dd")}`;
  const nextWeekHref = `/dashboard/my-work/calendar?week=${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {format(weekStart, "d MMM", { locale: az })} – {format(addDays(weekStart, 4), "d MMM yyyy", { locale: az })}
        </h2>
        <div className="flex items-center gap-1">
          <Link href={prevWeekHref} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href="/dashboard/my-work/calendar"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Bu həftə
          </Link>
          <Link href={nextWeekHref} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={cn(
                "flex min-h-[240px] flex-col rounded-xl border border-border bg-white p-3 dark:bg-card",
                isToday && "border-blue-300 ring-1 ring-blue-100 dark:border-blue-800 dark:ring-blue-900/40"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE", { locale: az })}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday ? "bg-blue-600 text-white" : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {dayTasks.length === 0 ? (
                  <p className="mt-6 text-center text-[11px] text-muted-foreground">—</p>
                ) : (
                  dayTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/dashboard/projects/${task.project.id}?task=${task.id}`}
                      className="rounded-md border-l-2 bg-muted/40 px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                      style={{ borderColor: task.project.color }}
                    >
                      <p className="truncate">{task.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{task.project.name}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
