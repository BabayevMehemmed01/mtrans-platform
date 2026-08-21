"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import type { KanbanColumn as ColType, KanbanTask } from "./types";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ

interface KanbanColumnProps {
  column: ColType;
  tasks: KanbanTask[];
  onAddTask?: () => void;
  onTaskClick: (task: KanbanTask) => void;
}

export function KanbanColumn({ column, tasks, onAddTask, onTaskClick }: KanbanColumnProps) {
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-72 flex-shrink-0 h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <span className={cn("text-sm font-semibold", column.headerClassName)}>{column.label}</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="p-1 rounded-md hover:bg-[hsl(var(--accent))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            title={t("kanbanColumn.addTaskTitle") || "Tapşırıq əlavə et"}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-2 overflow-y-auto rounded-xl p-2 transition-colors min-h-20",
          isOver
            ? "bg-[hsl(var(--primary)/0.06)] ring-2 ring-[hsl(var(--primary)/0.3)] ring-dashed"
            : column.bodyClassName || "bg-[hsl(var(--muted)/0.5)]"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && !isOver && (
          <div
            className={cn(
              "flex-1 flex items-center justify-center text-xs text-[hsl(var(--muted-foreground)/0.5)] py-8",
              onAddTask && "cursor-pointer"
            )}
            onClick={onAddTask}
          >
            {onAddTask ? (t("kanbanColumn.addTaskEmpty") || "+ Tapşırıq əlavə et") : (t("kanbanColumn.noTasks") || "Tapşırıq yoxdur")}
          </div>
        )}
      </div>

      {/* Add button at bottom */}
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] rounded-lg transition-colors w-full"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("kanbanColumn.addTaskBtn") || "Tapşırıq əlavə et"}
        </button>
      )}
    </div>
  );
}