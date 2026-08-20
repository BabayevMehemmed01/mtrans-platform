"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KanbanTask, TaskMember, KanbanLabel } from "@/components/kanban/types";
import { TaskDetailSheet } from "@/components/kanban/TaskDetailSheet";

interface ProjectCalendarProps {
  projectId: string;
  tasks: KanbanTask[];
  members: TaskMember[];
  labels: KanbanLabel[];
  onTaskUpdated: (task: KanbanTask) => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskCreated: (task: KanbanTask) => void;
}

export function ProjectCalendar({ projectId, tasks, members, labels, onTaskUpdated, onTaskDeleted, onTaskCreated }: ProjectCalendarProps) {
  // Tərcüməni qoşuruq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  
  const [addingDate, setAddingDate] = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loadingDay, setLoadingDay] = useState<Date | null>(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

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
          status: "TODO",
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
    <div className="h-full flex flex-col bg-slate-50/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 rounded-lg p-1 border border-gray-200">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={today} className="px-4 py-1.5 text-sm font-bold text-slate-700 hover:bg-white hover:shadow-sm transition-all rounded-md">
              {t("projectCalendar.today") || "Bu gün"}
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5 items-start">
          <Card className="bg-white ring-gray-200/80">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-bold text-slate-800">
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
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {format(selectedDate, "d MMMM yyyy")}
                </p>
                {selectedDayTasks.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {t("projectCalendar.noTasksForDay") || "Bu günə tapşırıq yoxdur"}
                  </p>
                ) : (
                  selectedDayTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="w-full text-left px-2.5 py-2 text-[12px] font-semibold rounded-lg border border-blue-100 bg-blue-50 text-blue-700 truncate hover:bg-blue-100"
                    >
                      {task.title}
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        <div className="min-w-0 min-h-[750px] h-full flex flex-col bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="grid grid-cols-7 border-b border-gray-200 bg-slate-50/80">
            {weekDays.map((day, i) => (
              <div key={i} className="py-3 text-center text-[12px] font-black text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
            {days.map((day, i) => {
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day) && !t.isArchived);
              const isAdding = addingDate && isSameDay(addingDate, day);
              const isLoading = loadingDay && isSameDay(loadingDay, day);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "group relative p-2 border-r border-b border-gray-100 transition-colors hover:bg-slate-50/80 flex flex-col",
                    !isSameMonth(day, monthStart) && "bg-gray-50/50 text-gray-400 opacity-60",
                    isToday(day) && "bg-blue-50/20",
                    isSameDay(day, selectedDate) && "bg-blue-50/60"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full", isToday(day) ? "bg-blue-600 text-white shadow-sm" : "text-slate-700")}>
                      {format(day, "d")}
                    </span>
                    
                    <button
                      onClick={() => { setAddingDate(day); setNewTaskTitle(""); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition-all"
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
                        className="w-full px-2 py-1.5 text-[11px] font-bold border-2 border-blue-400 rounded-md outline-none bg-white shadow-sm placeholder:font-medium placeholder:text-blue-300"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                    {isLoading && (
                      <div className="flex justify-center py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      </div>
                    )}
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          "px-2.5 py-1.5 text-[11px] font-bold rounded-md border cursor-pointer truncate transition-all hover:scale-[1.02] shadow-sm",
                          task.status === "DONE" ? "bg-green-50 text-green-700 border-green-200" :
                          task.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-blue-50 text-blue-700 border-blue-200"
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
          labels={labels}
          onUpdated={(t) => { onTaskUpdated(t); setSelectedTask(t); }}
          onDeleted={(id) => { onTaskDeleted(id); setSelectedTask(null); }}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}