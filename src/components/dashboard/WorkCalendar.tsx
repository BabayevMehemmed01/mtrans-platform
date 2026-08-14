"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { az } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarTaskItem {
  id: string;
  title: string;
  dueDate: string | Date;
  status: string;
  href: string;
  meta?: string;
}

const DONE_STATUSES = new Set(["DONE"]);
const WEEKDAY_LABELS = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"];

export function WorkCalendar({ tasks }: { tasks: CalendarTaskItem[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTaskItem[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedTasks = selectedDay ? tasksByDay.get(format(selectedDay, "yyyy-MM-dd")) ?? [] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 capitalize">
          {format(cursor, "LLLL yyyy", { locale: az })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((d) => subMonths(d, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Əvvəlki ay"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 text-xs text-gray-500 transition-colors"
          >
            Bu gün
          </button>
          <button
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Növbəti ay"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const done = dayTasks.filter((t) => DONE_STATUSES.has(t.status));
          const pending = dayTasks.filter((t) => !DONE_STATUSES.has(t.status));
          const isCurrentMonth = isSameMonth(day, cursor);
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(dayTasks.length > 0 ? day : null)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-xs transition-colors relative",
                isCurrentMonth ? "text-gray-800" : "text-gray-300",
                isToday(day) && "ring-1 ring-blue-400",
                isSelected && "bg-blue-50",
                dayTasks.length > 0 && "hover:bg-gray-50 cursor-pointer"
              )}
            >
              <span className={cn(isToday(day) && "font-bold text-blue-600")}>{format(day, "d")}</span>
              {dayTasks.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {pending.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  {done.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
        {selectedDay ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {format(selectedDay, "dd MMMM yyyy", { locale: az })} — {selectedTasks.length} tapşırıq
            </p>
            {selectedTasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    DONE_STATUSES.has(task.status) ? "bg-green-500" : "bg-amber-500"
                  )}
                />
                <span className="flex-1 min-w-0 text-sm text-gray-700 truncate group-hover:text-blue-700">
                  {task.title}
                </span>
                {task.meta && (
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex-shrink-0">
                    {task.meta}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Tapşırıqları görmək üçün tarixə klikləyin.
          </p>
        )}
      </div>
    </div>
  );
}
