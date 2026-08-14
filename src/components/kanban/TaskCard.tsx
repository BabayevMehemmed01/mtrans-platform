"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, getPriorityColor, timeAgo } from "@/lib/utils";
import { MessageSquare, Paperclip, CheckSquare, GripVertical, CalendarDays } from "lucide-react";
import type { KanbanTask } from "./types";

const PRIORITY_DOTS: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

interface TaskCardProps {
  task: KanbanTask;
  isDragging?: boolean;
  onClick: () => void;
}

export function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))]",
        "p-3.5 cursor-pointer select-none",
        "hover:border-[hsl(var(--primary)/0.4)] hover:shadow-md transition-all duration-150",
        (isSortableDragging || isDragging) && "opacity-40 shadow-2xl scale-105"
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded text-[hsl(var(--muted-foreground))]"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3" />
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map(({ label }) => (
            <span
              key={label.id}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium leading-snug mb-2.5 line-clamp-2 pr-4">
        {task.title}
      </p>

      {/* Priority + due date */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", PRIORITY_DOTS[task.priority])} />
        <span className={cn("text-xs font-medium", getPriorityColor(task.priority))}>
          {task.priority === "URGENT" ? "Təcili" : task.priority === "HIGH" ? "Yüksək" : task.priority === "MEDIUM" ? "Orta" : "Aşağı"}
        </span>
        {task.dueDate && (
          <span className={cn(
            "ml-auto flex items-center gap-1 text-[10px]",
            isOverdue ? "text-red-500 font-semibold" : "text-[hsl(var(--muted-foreground))]"
          )}>
            <CalendarDays className="w-3 h-3" />
            {timeAgo(new Date(task.dueDate))}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[hsl(var(--border)/0.5)]">
        {/* Assignee */}
        {task.assignee ? (
          <div
            className="w-6 h-6 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[10px] text-white font-bold"
            title={task.assignee.name ?? undefined}
          >
            {task.assignee.name?.[0]}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-[hsl(var(--border))]" />
        )}

        {/* Meta counts */}
        <div className="flex items-center gap-2.5 text-[hsl(var(--muted-foreground))]">
          {task._count.subtasks > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <CheckSquare className="w-3 h-3" /> {task._count.subtasks}
            </span>
          )}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <MessageSquare className="w-3 h-3" /> {task._count.comments}
            </span>
          )}
          {task._count.attachments > 0 && (
            <span className="flex items-center gap-1 text-[10px]">
              <Paperclip className="w-3 h-3" /> {task._count.attachments}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
