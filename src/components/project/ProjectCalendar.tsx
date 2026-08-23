"use client";

import { useState } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KanbanTask, TaskMember } from "@/components/kanban/types";
import { TaskDetailSheet } from "@/components/kanban/TaskDetailSheet";

interface ProjectCalendarProps {
  projectId: string;
  tasks: KanbanTask[];
  members: TaskMember[];
  onTaskUpdated: (task: KanbanTask) => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskCreated: (task: KanbanTask) => void;
}

export function ProjectCalendar({ projectId, tasks, members, onTaskUpdated, onTaskDeleted, onTaskCreated }: ProjectCalendarProps) {
  // Tərcüməni qoşuruq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  
  const [addingDate, setAddingDate] = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loadingDay, setLoadingDay] = useState<Date | null>(null);

  const nextPeriod = () =>
    setCurrentDate(viewMode === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));
  const prevPeriod = () =>
    setCurrentDate(viewMode === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  const today = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const startDate = viewMode === "week" ? weekStart : startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = viewMode === "week" ? weekEnd : endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Gün adlarını lüğətdən çəkirik
  const weekDays = [
    t("projectCalendar.weekDays.mon") || "B.e",
    t("projectCalendar.weekDays.tue") || "Ç.a",
    t("projectCalendar.weekDays.wed") || "Çər",
    t("projectCalendar.weekDays.thu") || "C.a",
    t("projectCalendar.weekDays.fri") || "Cüm",
    t("projectCalendar.weekDays.sat") || "Şən",
    t("projectCalendar.weekDays.sun") || "Baz"
  ];

  const handleQuickAdd = async (day: Date) => {
    if (!newTaskTitle.trim()) {
      setAddingDate(null);
      return;
    }
    setLoadingDay(day);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          projectId,
          status: "NOT_PLANNED",
          dueDate: day.toISOString()
        }),
      });
      if (res.ok) {
        const newTask = await res.json();
        onTaskCreated(newTask);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDay(null);
      setAddingDate(null);
      setNewTaskTitle("");
    }
  };

  const selectedDayTasks = tasks.filter(
    (task) => task.dueDate && isSameDay(new Date(task.dueDate), selectedDate) && !task.isArchived
  );

  return (
    <div className="h-full flex flex-col bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded-lg p-1 border border-border">
            <button onClick={prevPeriod} className="p-1.5 rounded-md hover:bg-card hover:shadow-sm transition-all text-muted-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={today} className="px-4 py-1.5 text-sm font-bold text-foreground hover:bg-card hover:shadow-sm transition-all rounded-md">
              {t("projectCalendar.today") || "Bu gün"}
            </button>
            <button onClick={nextPeriod} className="p-1.5 rounded-md hover:bg-card hover:shadow-sm transition-all text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-black text-foreground capitalize tracking-tight">
            {viewMode === "week"
              ? `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`
              : format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex rounded-lg border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
              viewMode === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("projectCalendar.viewMonth") || "Ay"}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
              viewMode === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("projectCalendar.viewWeek") || "Həftə"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5 items-start">
          <Card className="bg-card ring-border/80">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-bold text-foreground">
                {t("projectCalendar.pickerTitle") || "Təqvim"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                month={currentDate}
                onMonthChange={setCurrentDate}
                onSelect={(date) => {
                  if (!date) return;
                  setSelectedDate(date);
                  setCurrentDate(date);
                }}
              />
              <div className="mt-3 space-y-2 px-2 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {format(selectedDate, "d MMMM yyyy")}
                </p>
                {selectedDayTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("projectCalendar.noTasksForDay") || "Bu günə tapşırıq yoxdur"}
                  </p>
                ) : (
                  selectedDayTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="w-full text-left px-2.5 py-2 text-[12px] font-semibold rounded-lg border border-primary/20 bg-primary/5 text-primary truncate hover:bg-primary/10"
                    >
                      {task.title}
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        <div className="min-w-0 min-h-[750px] h-full flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {weekDays.map((day, i) => (
              <div key={i} className="py-3 text-center text-[12px] font-black text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className={cn(
            "flex-1 grid grid-cols-7",
            viewMode === "week" ? "auto-rows-[minmax(280px,1fr)]" : "auto-rows-[minmax(120px,1fr)]"
          )}>
            {days.map((day, i) => {
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day) && !t.isArchived);
              const isAdding = addingDate && isSameDay(addingDate, day);
              const isLoading = loadingDay && isSameDay(loadingDay, day);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "group relative p-2 border-r border-b border-border/70 transition-colors hover:bg-muted/50 flex flex-col",
                    !isSameMonth(day, monthStart) && viewMode === "month" && "bg-muted/30 text-muted-foreground opacity-60",
                    isToday(day) && "bg-primary/5",
                    isSameDay(day, selectedDate) && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full", isToday(day) ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground")}>
                      {format(day, "d")}
                    </span>
                    
                    <button
                      onClick={() => { setAddingDate(day); setNewTaskTitle(""); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-primary/10 text-primary transition-all"
                      title={t("projectCalendar.addTitle") || "Bu günə yeni tədbir/task əlavə et"}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {isAdding && (
                    <div className="mb-2">
                      <input
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleQuickAdd(day);
                          if (e.key === "Escape") setAddingDate(null);
                        }}
                        placeholder={t("projectCalendar.inputPlaceholder") || "Adı yaz, Enter bas..."}
                        disabled={isLoading !== null}
                        className="w-full px-2 py-1.5 text-[11px] font-bold border-2 border-primary/50 rounded-md outline-none bg-background text-foreground shadow-sm placeholder:font-medium placeholder:text-primary/40"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                    {isLoading && (
                      <div className="flex justify-center py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    )}
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          "px-2.5 py-1.5 text-[11px] font-bold rounded-md border cursor-pointer truncate transition-all hover:scale-[1.02] shadow-sm",
                          task.status === "DONE" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30" :
                          task.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" :
                          "bg-primary/5 text-primary border-primary/20"
                        )}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          members={members}
          onUpdated={(t) => { onTaskUpdated(t); setSelectedTask(t); }}
          onDeleted={(id) => { onTaskDeleted(id); setSelectedTask(null); }}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}