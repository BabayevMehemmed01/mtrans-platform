"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanTask, TaskMember, KanbanLabel } from "@/components/kanban/types";
import { TaskDetailSheet } from "@/components/kanban/TaskDetailSheet";

interface ProjectCalendarProps {
  tasks: KanbanTask[];
  members: TaskMember[];
  labels: KanbanLabel[];
  onTaskUpdated: (task: KanbanTask) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function ProjectCalendar({ tasks, members, labels, onTaskUpdated, onTaskDeleted }: ProjectCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Bazar ertəsi ilə başlasın
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100/80 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={today} className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-sm transition-all rounded-md">
              Bu gün
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {format(currentDate, dateFormat)}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        <div className="min-w-[800px] h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Week Days */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-slate-50/80">
            {weekDays.map((day, i) => (
              <div key={i} className="py-3 text-center text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {days.map((day, i) => {
              // Həmin günə aid taskları tapırıq
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day) && !t.isArchived);

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[120px] p-2 border-r border-b border-gray-100 transition-colors hover:bg-slate-50/50",
                    !isSameMonth(day, monthStart) && "bg-gray-50/50 text-gray-400 opacity-50",
                    isToday(day) && "bg-blue-50/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full", isToday(day) ? "bg-blue-600 text-white" : "text-gray-700")}>
                      {format(day, "d")}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar pr-1">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          "px-2 py-1.5 text-[11px] font-semibold rounded border cursor-pointer truncate transition-all hover:scale-[1.02] shadow-sm",
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

      {/* Task Detail Sheet */}
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