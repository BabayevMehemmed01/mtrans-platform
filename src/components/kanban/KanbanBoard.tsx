"use client";

import { useState, useCallback, useOptimistic } from "react";
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
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetailSheet } from "./TaskDetailSheet";
import type { KanbanTask, KanbanColumn as ColType, TaskMember, KanbanLabel } from "./types";

// =============================================================================
// Kanban Status Sütunları
// =============================================================================
const COLUMNS: ColType[] = [
  { id: "BACKLOG",     label: "Backlog",     color: "#94a3b8", bgColor: "#94a3b8/10" },
  { id: "TODO",        label: "To Do",        color: "#6366f1", bgColor: "#6366f1/10" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#f59e0b", bgColor: "#f59e0b/10" },
  { id: "IN_REVIEW",   label: "In Review",   color: "#8b5cf6", bgColor: "#8b5cf6/10" },
  { id: "DONE",        label: "Done",         color: "#22c55e", bgColor: "#22c55e/10" },
  { id: "CANCELLED",   label: "Cancelled",   color: "#ef4444", bgColor: "#ef4444/10" },
];

interface KanbanBoardProps {
  projectId?: string;
  initialTasks: KanbanTask[];
  members: TaskMember[];
  labels: KanbanLabel[];
}

// =============================================================================
// Kanban Board — Drag & Drop
// =============================================================================
export function KanbanBoard({ projectId, initialTasks, members, labels }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [createCol, setCreateCol] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // ---- Drag Handlers ----
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // over → bir sütun ID-si olduqda
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn.id as any } : t
        )
      );
      return;
    }

    // over → başqa bir task-ın üzərindəyik
    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;

    setTasks((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId);
      const overIndex = prev.findIndex((t) => t.id === overId);
      const updated = [...prev];
      // Sütunu dəyişdirirsə
      if (updated[activeIndex].status !== overTask.status) {
        updated[activeIndex] = { ...updated[activeIndex], status: overTask.status };
      }
      return arrayMove(updated, activeIndex, overIndex);
    });
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const movedTask = tasks.find((t) => t.id === activeId);
    if (!movedTask) return;

    // API-ya yeni status göndər
    try {
      await fetch(`/api/tasks/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: movedTask.status }),
      });
    } catch (err) {
      console.error("Task status update failed:", err);
    }
  }, [tasks]);

  // ---- Task CRUD callbacks ----
  const handleTaskCreated = useCallback((newTask: KanbanTask) => {
    setTasks((prev) => [newTask, ...prev]);
    setCreateCol(null);
  }, []);

  const handleTaskUpdated = useCallback((updatedTask: KanbanTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  }, []);

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
        {/* Scrollable columns container */}
        <div className="flex gap-4 h-full overflow-x-auto px-6 py-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id && !t.isArchived);
            return (
              <SortableContext
                key={col.id}
                id={col.id}
                items={colTasks.map((t) => t.id)}
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

        {/* Drag Overlay — sürüklənən kartın "kölgəsi" */}
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

      {/* Create Task Modal */}
      {createCol && (
        <CreateTaskModal
          projectId={projectId || ""}
          defaultStatus={createCol}
          members={members}
          labels={labels}
          onCreated={handleTaskCreated}
          onClose={() => setCreateCol(null)}
        />
      )}

      {/* Task Detail Sheet */}
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
