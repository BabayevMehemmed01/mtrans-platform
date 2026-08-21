import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { az } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

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
        <h2 className="text-lg font-semibold tracking-tight text-slate-800">
          {format(weekStart, "d MMM", { locale: az })} –{" "}
          {format(addDays(weekStart, 4), "d MMM yyyy", { locale: az })}
        </h2>
        <div className="flex items-center gap-1">
          <Link
            href={prevWeekHref}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-slate-500")}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href="/dashboard/my-work/calendar"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Bu həftə
          </Link>
          <Link
            href={nextWeekHref}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-slate-500")}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
        <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-5 md:divide-x md:divide-y-0">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDay.get(key) ?? [];
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className={cn("flex min-h-0 flex-col", isToday && "bg-blue-50/40")}
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {format(day, "EEE", { locale: az })}
                  </span>
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                      isToday ? "bg-blue-600 text-white shadow-sm" : "text-slate-800"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-2.5">
                  {dayTasks.length === 0 ? (
                    <p className="px-1 py-3 text-center text-[11px] text-slate-400">No tasks</p>
                  ) : (
                    dayTasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/dashboard/projects/${task.project.id}?task=${task.id}`}
                        className="rounded-lg border border-slate-100 bg-white px-2.5 py-2 text-[11px] shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
                        style={{ borderLeftWidth: 3, borderLeftColor: task.project.color }}
                      >
                        <p className="truncate font-medium text-slate-800">{task.title}</p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">{task.project.name}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
