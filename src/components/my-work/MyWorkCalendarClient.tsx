"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { az } from "date-fns/locale";
import { ArrowUpRight, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PriorityBadge } from "./TaskCells";

// =============================================================================
// My Work — Calendar (client, dinamik). Həftə/Ay seqmenti (Shadcn Tabs) və
// bütün naviqasiya lokal state ilə (səhifə yenilənmədən) idarə olunur.
// Tapşırığa klik → tam səhifəyə keçmədən Sheet-də sürətli önizləmə açılır.
// =============================================================================

export type MyWorkCalendarTask = {
  id: string;
  title: string;
  dueDate: Date | string;
  priority: string;
  status: string;
  project: { id: string; name: string; color: string };
};

type ViewMode = "week" | "month";

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_PLANNED: "Planlaşdırılmayıb",
  IN_PROGRESS: "Davam edir",
  REVIEW: "Yoxlanılır",
  DONE: "Tamamlandı",
  BACKLOG: "Növbəti",
  TODO: "Gözləyir",
  IN_REVIEW: "Nəzərdən keçirilir",
  CANCELLED: "Ləğv edildi",
};

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function MyWorkCalendarClient({ tasks }: { tasks: MyWorkCalendarTask[] }) {
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedTask, setSelectedTask] = useState<MyWorkCalendarTask | null>(null);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, MyWorkCalendarTask[]>();
    for (const task of tasks) {
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
    }
    return map;
  }, [tasks]);

  const todayKey = format(new Date(), "yyyy-MM-dd");

  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const monthGridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const monthGridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const monthDays = useMemo(() => {
    const days: Date[] = [];
    for (let d = monthGridStart; d <= monthGridEnd; d = addDays(d, 1)) days.push(d);
    return days;
  }, [monthGridStart, monthGridEnd]);
  const weekdayLabels = useMemo(
    () => Array.from({ length: 7 }, (_, i) => format(addDays(monthGridStart, i), "EEE", { locale: az })),
    [monthGridStart]
  );

  const title =
    view === "week"
      ? `${format(weekStart, "d MMM", { locale: az })} – ${format(addDays(weekStart, 4), "d MMM yyyy", { locale: az })}`
      : format(cursor, "LLLL yyyy", { locale: az });

  const goPrev = () => setCursor((d) => (view === "week" ? subWeeks(d, 1) : subMonths(d, 1)));
  const goNext = () => setCursor((d) => (view === "week" ? addWeeks(d, 1) : addMonths(d, 1)));
  const goToday = () => setCursor(new Date());

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/30">
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-lg border border-border bg-muted p-1">
            <button type="button" onClick={goPrev} className="rounded-md p-1.5 text-muted-foreground transition-all hover:bg-card hover:shadow-sm" aria-label="Əvvəlki">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={goToday} className="rounded-md px-4 py-1.5 text-sm font-bold text-foreground transition-all hover:bg-card hover:shadow-sm">
              Bu gün
            </button>
            <button type="button" onClick={goNext} className="rounded-md p-1.5 text-muted-foreground transition-all hover:bg-card hover:shadow-sm" aria-label="Növbəti">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-xl font-black capitalize tracking-tight text-foreground">{title}</h2>
        </div>
        <div className="flex rounded-lg border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setView("month")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
              view === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Ay
          </button>
          <button
            type="button"
            onClick={() => setView("week")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
              view === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Həftə
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:p-6">

      {view === "week" ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-5 md:divide-x md:divide-y-0">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDay.get(key) ?? [];
              const isToday = key === todayKey;

              return (
                <div key={key} className={cn("flex min-h-0 flex-col", isToday && "bg-primary/5")}>
                  <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {format(day, "EEE", { locale: az })}
                    </span>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                        isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 p-2.5">
                    {dayTasks.length === 0 ? (
                      <p className="px-1 py-3 text-center text-[11px] text-muted-foreground/70">Tapşırıq yoxdur</p>
                    ) : (
                      dayTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => setSelectedTask(task)}
                          className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-left text-[11px] shadow-sm transition-all hover:-translate-y-0.5 hover:border-muted-foreground/30 hover:shadow-md"
                          style={{ borderLeftWidth: 3, borderLeftColor: task.project.color }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 flex-shrink-0 rounded-full", PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.LOW)} />
                            <p className="truncate font-medium text-foreground">{task.title}</p>
                          </div>
                          <p className="mt-0.5 truncate pl-3 text-[10px] text-muted-foreground">{task.project.name}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {weekdayLabels.map((label, i) => (
              <div key={i} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDay.get(key) ?? [];
              const isToday = key === todayKey;
              const inMonth = isSameMonth(day, cursor);
              const visible = dayTasks.slice(0, 3);
              const overflow = dayTasks.length - visible.length;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex min-h-[104px] flex-col gap-1 border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0",
                    !inMonth && "bg-muted/20",
                    isToday && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 flex-shrink-0 items-center justify-center self-end rounded-full text-xs font-semibold tabular-nums",
                      isToday ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-1 flex-col gap-1">
                    {visible.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        className="flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-foreground transition-colors hover:bg-accent"
                        style={{ borderLeftWidth: 2, borderLeftColor: task.project.color }}
                      >
                        <span className={cn("size-1.5 flex-shrink-0 rounded-full", PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.LOW)} />
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}
                    {overflow > 0 && (
                      <Popover>
                        <PopoverTrigger className="rounded px-1.5 text-left text-[10px] font-semibold text-primary hover:underline">
                          +{overflow} daha
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64">
                          <p className="px-1 pb-1 text-xs font-semibold capitalize text-foreground">
                            {format(day, "d MMMM", { locale: az })}
                          </p>
                          <div className="flex flex-col gap-0.5">
                            {dayTasks.map((task) => (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => setSelectedTask(task)}
                                className="flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-xs text-foreground transition-colors hover:bg-accent"
                              >
                                <span className={cn("size-1.5 flex-shrink-0 rounded-full", PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.LOW)} />
                                <span className="truncate">{task.title}</span>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <SheetContent className="flex flex-col p-6 sm:max-w-md">
          {selectedTask && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: selectedTask.project.color }} />
                  <SheetDescription className="!mt-0">{selectedTask.project.name}</SheetDescription>
                </div>
                <SheetTitle>{selectedTask.title}</SheetTitle>
              </SheetHeader>

              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={selectedTask.priority} />
                <Badge variant="outline">{STATUS_LABEL[selectedTask.status] ?? selectedTask.status}</Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="size-4 flex-shrink-0" />
                {format(new Date(selectedTask.dueDate), "d MMMM yyyy", { locale: az })}
              </div>

              <SheetFooter className="mt-auto pt-6">
                <Button
                  nativeButton={false}
                  render={<Link href={`/dashboard/projects/${selectedTask.project.id}?task=${selectedTask.id}`} />}
                  className="gap-1.5"
                >
                  Tam tapşırığa keç
                  <ArrowUpRight className="size-4" />
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
