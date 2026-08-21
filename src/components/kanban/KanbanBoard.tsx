"use client";

import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { format } from "date-fns";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetailSheet } from "./TaskDetailSheet";
import type { KanbanTask, KanbanColumn as ColType, TaskMember, KanbanLabel } from "./types";
import { PLANNER_COLUMNS, toPlannerStatus, DEFAULT_TASK_STATUS } from "@/lib/task-status";
import { DEADLINE_COLUMNS, dueDateForBucket, getDeadlineBucket } from "@/lib/task-deadline";

type BoardVariant = "planner" | "deadline";

const PLANNER_TRANS_KEY: Record<string, string> = {
  NOT_PLANNED: "colNotPlanned",
  IN_PROGRESS: "colInProgress",
  REVIEW: "colReview",
  DONE: "colDone",
};

const DEADLINE_TRANS_KEY: Record<string, string> = {
  OVERDUE: "colOverdue",
  DUE_TODAY: "colDueToday",
  DUE_THIS_WEEK: "colDueThisWeek",
  DUE_NEXT_WEEK: "colDueNextWeek",
  NO_DEADLINE: "colNoDeadline",
};

interface KanbanBoardProps {
  projectId?: string;
  initialTasks: KanbanTask[];
  members: TaskMember[];
  labels: KanbanLabel[];
  variant?: BoardVariant;
  onTaskCreated?: (task: KanbanTask) => void;
  onTaskUpdated?: (task: KanbanTask) => void;
  onTaskDeleted?: (taskId: string) => void;
}

function columnIdForTask(task: KanbanTask, variant: BoardVariant): string {
  if (variant === "deadline") return getDeadlineBucket(task.dueDate);
  return toPlannerStatus(task.status);
}

export function KanbanBoard({
  projectId,
  initialTasks,
  members,
  labels,
  variant = "planner",
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: KanbanBoardProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const COLUMNS: ColType[] = useMemo(() => {
    if (variant === "deadline") {
      return DEADLINE_COLUMNS.map((col) => ({
        ...col,
        label: t(`kanbanBoard.${DEADLINE_TRANS_KEY[col.id]}`) || col.label,
      }));
    }
    return PLANNER_COLUMNS.map((col) => ({
      ...col,
      label: t(`kanbanBoard.${PLANNER_TRANS_KEY[col.id]}`) || col.label,
    }));
  }, [variant, t]);

  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [createCol, setCreateCol] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const applyColumn = useCallback(
    (task: KanbanTask, columnId: string): KanbanTask => {
      if (variant === "deadline") {
        return { ...task, dueDate: dueDateForBucket(columnId) };
      }
      return { ...task, status: columnId as KanbanTask["status"] };
    },
    [variant]
  );

  const persistMove = useCallback(
    async (taskId: string, columnId: string) => {
      const payload =
        variant === "deadline"
          ? { dueDate: dueDateForBucket(columnId)?.toISOString() ?? null }
          : { status: columnId };
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error(t("kanbanBoard.errorStatusUpdate") || "Task status update failed:", err);
      }
    },
    [variant, t]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((item) => item.id === event.active.id);
    setActiveTask(task ?? null);
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === activeId ? applyColumn(item, overColumn.id) : item
        )
      );
      return;
    }

    const overTask = tasks.find((item) => item.id === overId);
    if (!overTask) return;

    setTasks((prev) => {
      const activeIndex = prev.findIndex((item) => item.id === activeId);
      const overIndex = prev.findIndex((item) => item.id === overId);
      if (activeIndex < 0 || overIndex < 0) return prev;
      const updated = [...prev];
      const nextColumn = columnIdForTask(overTask, variant);
      if (columnIdForTask(updated[activeIndex], variant) !== nextColumn) {
        updated[activeIndex] = applyColumn(updated[activeIndex], nextColumn);
      }
      return arrayMove(updated, activeIndex, overIndex);
    });
  }, [tasks, COLUMNS, applyColumn, variant]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const movedTask = tasks.find((item) => item.id === activeId);
    if (!movedTask) return;

    const columnId = columnIdForTask(movedTask, variant);
    await persistMove(activeId, columnId);
    onTaskUpdated?.(movedTask);
  }, [tasks, variant, persistMove, onTaskUpdated]);

  const handleTaskCreated = useCallback((newTask: KanbanTask) => {
    setTasks((prev) => [newTask, ...prev]);
    setCreateCol(null);
    onTaskCreated?.(newTask);
  }, [onTaskCreated]);

  const handleTaskUpdated = useCallback((updatedTask: KanbanTask) => {
    setTasks((prev) => prev.map((item) => (item.id === updatedTask.id ? updatedTask : item)));
    setSelectedTask(updatedTask);
    onTaskUpdated?.(updatedTask);
  }, [onTaskUpdated]);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== taskId));
    setSelectedTask(null);
    onTaskDeleted?.(taskId);
  }, [onTaskDeleted]);

  const createDefaults = useMemo(() => {
    if (!createCol) return { status: DEFAULT_TASK_STATUS, dueDate: "" };
    if (variant === "deadline") {
      const due = dueDateForBucket(createCol);
      return {
        status: DEFAULT_TASK_STATUS,
        dueDate: due ? format(due, "yyyy-MM-dd") : "",
      };
    }
    return { status: createCol, dueDate: "" };
  }, [createCol, variant]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex gap-4 h-full overflow-x-auto px-6 py-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter(
              (item) =>
                !item.isArchived &&
                item.status !== "CANCELLED" &&
                columnIdForTask(item, variant) === col.id
            );
            return (
              <SortableContext
                key={col.id}
                id={col.id}
                items={colTasks.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  column={col}
                  tasks={colTasks}
                  onAddTask={projectId ? () => setCreateCol(col.id) : undefined}
                  onTaskClick={(task) => setSelectedTask(task)}
                />
              </SortableContext>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              isDragging
              onClick={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {createCol && (
        <CreateTaskModal
          projectId={projectId || ""}
          defaultStatus={createDefaults.status}
          defaultDueDate={createDefaults.dueDate || null}
          members={members}
          labels={labels}
          onCreated={handleTaskCreated}
          onClose={() => setCreateCol(null)}
        />
      )}

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          members={members}
          labels={labels}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
