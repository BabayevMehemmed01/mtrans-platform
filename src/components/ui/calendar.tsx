"use client";

import * as React from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  className?: string;
  mode?: "single";
};

function Calendar({
  selected,
  onSelect,
  month: monthProp,
  onMonthChange,
  className,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(selected ?? new Date());
  const month = monthProp ?? internalMonth;

  const setMonth = (next: Date) => {
    if (onMonthChange) onMonthChange(next);
    else setInternalMonth(next);
  };

  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
  });

  const weekDays = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"];

  return (
    <div className={cn("p-3 bg-background", className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium capitalize">
          {format(month, "MMMM yyyy")}
        </div>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
        {weekDays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthStart);
          const selectedDay = selected ? isSameDay(day, selected) : false;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center justify-self-center rounded-md text-sm transition-colors",
                !inMonth && "text-muted-foreground opacity-50",
                inMonth && !selectedDay && "hover:bg-accent hover:text-accent-foreground",
                selectedDay && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isToday(day) && !selectedDay && "bg-accent text-accent-foreground"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
