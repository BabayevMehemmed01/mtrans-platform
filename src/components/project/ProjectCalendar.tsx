"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  
  // Yeni Task əlavə etmək üçün state-lər
  const [addingDate, setAddingDate] = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loadingDay, setLoadingDay] = useState<Date | null>(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Bazar ertəsi ilə başlasın
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"];

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
          dueDate: day.toISOString() // Seçilən günə təyin edirik
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

  return (
    <div className="h-full flex flex-col bg-slate-50/50 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 rounded-lg p-1 border border-gray-200">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={today} className="px-4 py-1.5 text-sm font-bold text-slate-700 hover:bg-white hover:shadow-sm transition-all rounded-md">
              Bu gün
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

      {/* Calendar Grid Container (Kəsilmə problemini həll edən scroll sahəsi) */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
        <div className="min-w-[900px] min-h-[750px] h-full flex flex-col bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Week Days */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-slate-50/80">
            {weekDays.map((day, i) => (
              <div key={i} className="py-3 text-center text-[12px] font-black text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
            {days.map((day, i) => {
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day) && !t.isArchived);
              const isAdding = addingDate && isSameDay(addingDate, day);
              const isLoading = loadingDay && isSameDay(loadingDay, day);

              return (
                <div
                  key={i}
                  className={cn(
                    "group relative p-2 border-r border-b border-gray-100 transition-colors hover:bg-slate-50/80 flex flex-col",
                    !isSameMonth(day, monthStart) && "bg-gray-50/50 text-gray-400 opacity-60",
                    isToday(day) && "bg-blue-50/20"
                  )}
                >
                  {/* Günün rəqəmi və Əlavə et düyməsi */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full", isToday(day) ? "bg-blue-600 text-white shadow-sm" : "text-slate-700")}>
                      {format(day, "d")}
                    </span>
                    
                    <button
                      onClick={() => { setAddingDate(day); setNewTaskTitle(""); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition-all"
                      title="Bu günə yeni tədbir/task əlavə et"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Task əlavə etmə qutusu (İnput) */}
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
                        placeholder="Adı yaz, Enter bas..."
                        disabled={isLoading !== null}
                        className="w-full px-2 py-1.5 text-[11px] font-bold border-2 border-blue-400 rounded-md outline-none bg-white shadow-sm placeholder:font-medium placeholder:text-blue-300"
                      />
                    </div>
                  )}

                  {/* Tasklar Siyahısı */}
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

      {/* Task Detail Sheet (Üstünə basanda açılan detal pəncərəsi) */}
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