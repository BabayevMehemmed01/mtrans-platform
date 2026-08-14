"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Check,
  Trash2,
  Pencil,
  Plus,
  ChevronDown,
  ChevronRight,
  Circle,
  Calendar,
  Flag,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDetailSheet } from "@/components/kanban/TaskDetailSheet";
import type { KanbanTask, TaskMember, KanbanLabel } from "@/components/kanban/types";

// ── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_MAP = {
  URGENT: { label: "Təcili", color: "text-red-500", bg: "bg-red-50 text-red-600" },
  HIGH:   { label: "Yüksək", color: "text-orange-500", bg: "bg-orange-50 text-orange-600" },
  MEDIUM: { label: "Orta",   color: "text-amber-500", bg: "bg-amber-50 text-amber-600" },
  LOW:    { label: "Aşağı",  color: "text-gray-400",  bg: "bg-gray-50 text-gray-500" },
} as const;

const STATUS_MAP = {
  TODO:        { label: "To Do",       color: "#6366f1", dot: "border-[#6366f1]" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b", dot: "border-[#f59e0b] bg-[#f59e0b]" },
  DONE:        { label: "Done",        color: "#22c55e", dot: "border-[#22c55e] bg-[#22c55e]" },
  BACKLOG:     { label: "Backlog",     color: "#94a3b8", dot: "border-[#94a3b8]" },
  IN_REVIEW:   { label: "In Review",   color: "#8b5cf6", dot: "border-[#8b5cf6] bg-[#8b5cf6]" },
  CANCELLED:   { label: "Cancelled",   color: "#ef4444", dot: "border-[#ef4444]" },
} as const;

type GroupBy = "status" | "priority" | "assignee";

interface TaskListViewProps {
  projectId: string;
  tasks: KanbanTask[];
  members: TaskMember[];
  labels: KanbanLabel[];
  onTaskUpdated: (task: KanbanTask) => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskCreated: (task: KanbanTask) => void;
  initialTaskId?: string;
}

// Lighter-weight shape used for inline-loaded subtasks in the List view.
// Kept local to this file (rather than widening the shared KanbanTask type)
// since only the List view needs a nested subtasks array — the Kanban board
// only ever needs the `_count.subtasks` number it already has.
interface SubtaskItem {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string | Date | null;
  assignee?: { id: string; name: string | null; avatar?: string | null } | null;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
}

// ── Inline quick-add row (parent tasks, per status group) ───────────────────
function AddTaskRow({
  status,
  projectId,
  onCreated,
}: {
  status: string;
  projectId: string;
  onCreated: (task: KanbanTask) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), projectId, status }),
      });
      if (res.ok) {
        const newTask = await res.json();
        onCreated(newTask);
        setTitle("");
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors rounded-lg"
      >
        <Plus className="w-4 h-4" />
        Tapşırıq əlavə et
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-50/50 rounded-lg border border-blue-200">
      <Circle className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setOpen(false); setTitle(""); }
        }}
        placeholder="Tapşırıq adı yazın, Enter-ə basın..."
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        disabled={loading}
      />
      <button onClick={() => { setOpen(false); setTitle(""); }} className="text-xs text-muted-foreground hover:text-foreground">
        Ləğv et
      </button>
    </div>
  );
}

// ── Inline quick-add row (subtasks, nested under a parent) ──────────────────
function AddSubtaskRow({
  parentId,
  projectId,
  onCreated,
}: {
  parentId: string;
  projectId: string;
  onCreated: (task: SubtaskItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), projectId, parentId }),
      });
      if (res.ok) {
        const newTask = await res.json();
        onCreated(newTask);
        setTitle("");
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white transition-colors rounded-lg"
      >
        <Plus className="w-3.5 h-3.5" />
        Alt tapşırıq əlavə et
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50/50 rounded-lg border border-blue-200">
      <Circle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setOpen(false); setTitle(""); }
        }}
        placeholder="Alt tapşırıq adı yazın, Enter-ə basın..."
        className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        disabled={loading}
      />
      <button onClick={() => { setOpen(false); setTitle(""); }} className="text-xs text-muted-foreground hover:text-foreground">
        Ləğv et
      </button>
    </div>
  );
}

// ── Status badge + popover (shared by parent rows & subtask rows) ───────────
function StatusBadge({
  taskId,
  status,
  onChanged,
  compact,
}: {
  taskId: string;
  status: string;
  onChanged: (raw: any) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const st = STATUS_MAP[status as keyof typeof STATUS_MAP];

  const changeStatus = async (newStatus: string) => {
    setOpen(false);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        onChanged(updated);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "rounded-full font-medium border transition-colors hover:opacity-80",
          compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
        )}
        style={{
          borderColor: st?.color,
          color: st?.color,
          backgroundColor: `${st?.color}15`,
        }}
      >
        {st?.label}
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-20 bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-1 w-44">
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <button
              key={key}
              onClick={() => changeStatus(key)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: val.color }}
              />
              {val.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Assignee cell + popover (shared by parent rows & subtask rows) ──────────
function AssigneeCell({
  taskId,
  assignee,
  members,
  onChanged,
  compact,
}: {
  taskId: string;
  assignee?: { id: string; name: string | null; avatar?: string | null } | null;
  members: TaskMember[];
  onChanged: (raw: any) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const assign = async (memberId: string | null) => {
    setOpen(false);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: memberId }),
      });
      if (res.ok) {
        const updated = await res.json();
        onChanged(updated);
      }
    } catch (e) { console.error(e); }
  };

  const avatarSize = compact ? "w-5 h-5" : "w-6 h-6";

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity rounded-md"
        title="İcraçını dəyiş"
      >
        {assignee ? (
          <>
            <Avatar className={avatarSize}>
              <AvatarImage src={assignee.avatar ?? undefined} />
              <AvatarFallback className={compact ? "text-[9px]" : "text-[10px]"}>
                {getInitials(assignee.name ?? "")}
              </AvatarFallback>
            </Avatar>
            {!compact && (
              <span className="text-xs text-gray-600 hidden xl:block truncate max-w-[60px]">
                {assignee.name?.split(" ")[0]}
              </span>
            )}
          </>
        ) : (
          <div className={cn(avatarSize, "rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center")}>
            <User className="w-3 h-3 text-gray-300" />
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-1 w-48 max-h-56 overflow-y-auto">
          <button
            onClick={() => assign(null)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50 transition-colors text-left text-gray-500"
          >
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
              <User className="w-2.5 h-2.5 text-gray-300" />
            </div>
            Təyin edilməyib
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => assign(m.id)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={m.avatar ?? undefined} />
                <AvatarFallback className="text-[9px]">{getInitials(m.name)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Due date cell + popover (shared by parent rows & subtask rows) ──────────
function DueDateCell({
  taskId,
  dueDate,
  isDone,
  onChanged,
  compact,
}: {
  taskId: string;
  dueDate?: Date | string | null;
  isDone?: boolean;
  onChanged: (raw: any) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(dueDate ? format(new Date(dueDate), "yyyy-MM-dd") : "");

  useEffect(() => {
    setVal(dueDate ? format(new Date(dueDate), "yyyy-MM-dd") : "");
  }, [dueDate]);

  const save = async (nextVal: string) => {
    setOpen(false);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: nextVal ? new Date(nextVal).toISOString() : null }),
      });
      if (res.ok) {
        const updated = await res.json();
        onChanged(updated);
      }
    } catch (e) { console.error(e); }
  };

  const isOverdue = !!dueDate && new Date(dueDate) < new Date() && !isDone;

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 rounded-md hover:bg-gray-100 transition-colors px-1 py-0.5",
          compact ? "text-[11px]" : "text-xs",
          isOverdue ? "text-red-500 font-medium" : dueDate ? "text-muted-foreground" : "text-gray-300"
        )}
        title="Son tarixi dəyiş"
      >
        <Calendar className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {dueDate ? format(new Date(dueDate), "dd MMM") : "—"}
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-20 bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-3 w-52">
          <input
            type="date"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400"
          />
          <div className="flex items-center justify-between mt-2">
            <button onClick={() => save("")} className="text-[11px] text-gray-400 hover:text-red-500">
              Təmizlə
            </button>
            <button onClick={() => save(val)} className="text-[11px] font-medium text-blue-600 hover:underline">
              Təsdiqlə
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Single subtask row (nested, compact) ─────────────────────────────────────
function SubtaskRow({
  subtask,
  members,
  onUpdated,
  onDeleted,
}: {
  subtask: SubtaskItem;
  members: TaskMember[];
  onUpdated: (raw: any) => void;
  onDeleted: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const dot = STATUS_MAP[subtask.status as keyof typeof STATUS_MAP];

  const markDone = async () => {
    const newStatus = subtask.status === "DONE" ? "TODO" : "DONE";
    try {
      const res = await fetch(`/api/tasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
      }
    } catch (e) { console.error(e); }
  };

  const deleteSub = async () => {
    if (!confirm("Bu alt tapşırığı silmək istədiyinizə əminsiniz?")) return;
    try {
      await fetch(`/api/tasks/${subtask.id}`, { method: "DELETE" });
      onDeleted(subtask.id);
    } catch (e) { console.error(e); }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 pl-14 pr-4 py-1.5 border-t border-gray-100/70 transition-colors",
        hovered ? "bg-white" : "bg-transparent",
        subtask.status === "DONE" && "opacity-60"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={markDone}
        title={subtask.status === "DONE" ? "Tamamlanmamış işarələ" : "Tamamlandı işarələ"}
        className="flex-shrink-0"
      >
        {subtask.status === "DONE" ? (
          <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-2 h-2 text-white" strokeWidth={3} />
          </div>
        ) : (
          <div className={cn("w-3.5 h-3.5 rounded-full border-2", dot?.dot ?? "border-gray-300")} />
        )}
      </button>

      <StatusBadge taskId={subtask.id} status={subtask.status} onChanged={onUpdated} compact />

      <span
        className={cn(
          "flex-1 min-w-0 text-xs text-gray-600 truncate",
          subtask.status === "DONE" && "line-through text-gray-400"
        )}
      >
        {subtask.title}
      </span>

      <AssigneeCell taskId={subtask.id} assignee={subtask.assignee} members={members} onChanged={onUpdated} compact />
      <DueDateCell taskId={subtask.id} dueDate={subtask.dueDate} isDone={subtask.status === "DONE"} onChanged={onUpdated} compact />

      <button
        onClick={deleteSub}
        className={cn(
          "p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0",
          hovered ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        title="Sil"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Single task row ──────────────────────────────────────────────────────────
function TaskRow({
  task,
  members,
  onUpdated,
  onDeleted,
  onTaskClick,
}: {
  task: KanbanTask;
  members: TaskMember[];
  onUpdated: (t: KanbanTask) => void;
  onDeleted: (id: string) => void;
  onTaskClick: (task: KanbanTask) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);

  // ── Subtasks: lazily loaded on first expand, cached locally so
  // re-collapsing/re-expanding doesn't refetch. Only mutated in-place on
  // create/toggle/delete rather than refetched.
  const [expanded, setExpanded] = useState(false);
  const [subtasks, setSubtasks] = useState<SubtaskItem[] | null>(null);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  const prio = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP.MEDIUM;

  const loadSubtasks = useCallback(async () => {
    setLoadingSubtasks(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      if (res.ok) {
        const data = await res.json();
        setSubtasks(data.subtasks ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubtasks(false);
    }
  }, [task.id]);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && subtasks === null) loadSubtasks();
  };

  const handleSubtaskCreated = (created: SubtaskItem) => {
    setSubtasks((prev) => [...(prev ?? []), created]);
  };
  const handleSubtaskUpdated = (raw: any) => {
    setSubtasks((prev) => prev?.map((s) => (s.id === raw.id ? { ...s, ...raw } : s)) ?? prev);
  };
  const handleSubtaskDeleted = (id: string) => {
    setSubtasks((prev) => prev?.filter((s) => s.id !== id) ?? prev);
  };

  const markDone = async () => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated({ ...task, ...updated });
      }
    } catch (e) { console.error(e); }
  };

  const saveTitle = async () => {
    if (!titleVal.trim() || titleVal === task.title) { setEditingTitle(false); return; }
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleVal }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated({ ...task, ...updated });
      }
    } catch (e) { console.error(e); }
    setEditingTitle(false);
  };

  const deleteTask = async () => {
    if (!confirm("Bu tapşırığı silmək istədiyinizə əminsiniz?")) return;
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      onDeleted(task.id);
    } catch (e) { console.error(e); }
  };

  const subtaskCount = subtasks?.length ?? task._count?.subtasks ?? 0;

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 transition-colors",
          hovered ? "bg-gray-50/70" : "bg-white",
          task.status === "DONE" && "opacity-60"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Expand / subtasks toggle ─── */}
        <button
          onClick={toggleExpand}
          className="flex-shrink-0 w-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title={expanded ? "Alt tapşırıqları gizlət" : "Alt tapşırıqları göstər"}
        >
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-90")} />
        </button>

        {/* ── Done toggle ─────── */}
        <button
          onClick={markDone}
          title={task.status === "DONE" ? "Tamamlanmamış işarələ" : "Tamamlandı işarələ"}
          className="flex-shrink-0"
        >
          {task.status === "DONE" ? (
            <CheckCircleIcon />
          ) : (
            <div className={cn("w-4 h-4 rounded-full border-2 transition-colors", STATUS_MAP[task.status as keyof typeof STATUS_MAP]?.dot ?? "border-gray-300")} />
          )}
        </button>

        {/* ── Status badge (clickable) ─── */}
        <StatusBadge
          taskId={task.id}
          status={task.status}
          onChanged={(raw) => onUpdated({ ...task, ...raw })}
        />

        {/* ── Title ─────────────────────── */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              autoFocus
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setTitleVal(task.title); setEditingTitle(false); } }}
              className="w-full text-sm bg-transparent border-b border-blue-400 outline-none"
            />
          ) : (
            <span
              className={cn(
                "text-sm font-medium text-gray-800 truncate block cursor-pointer hover:text-blue-600 transition-colors",
                task.status === "DONE" && "line-through text-gray-400"
              )}
              onClick={() => onTaskClick(task)}
              onDoubleClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
              title="Klikləyin detalları görmək üçün. İki dəfə klik — redaktə."
            >
              {task.title}
              {subtaskCount > 0 && (
                <span className="ml-2 text-[11px] text-gray-400 font-normal">
                  {(subtasks ?? []).filter((s) => s.status === "DONE").length}/{subtaskCount}
                </span>
              )}
            </span>
          )}
        </div>

        {/* ── Labels ──────────────────── */}
        {task.labels && task.labels.length > 0 && (
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {task.labels.slice(0, 2).map(({ label }) => (
              <span
                key={label.id}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${label.color}25`, color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* ── Assignee (clickable) ─────── */}
        <div className="flex-shrink-0 w-28 flex justify-center">
          <AssigneeCell
            taskId={task.id}
            assignee={task.assignee}
            members={members}
            onChanged={(raw) => onUpdated({ ...task, ...raw })}
          />
        </div>

        {/* ── Due date (clickable) ─────── */}
        <div className="flex-shrink-0 w-28 flex justify-end">
          <DueDateCell
            taskId={task.id}
            dueDate={task.dueDate}
            isDone={task.status === "DONE"}
            onChanged={(raw) => onUpdated({ ...task, ...raw })}
          />
        </div>

        {/* ── Priority ─────────────────── */}
        <div className="flex-shrink-0 w-20 hidden md:flex justify-end">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", prio.bg)}>
            {prio.label}
          </span>
        </div>

        {/* ── Hover actions ─────────────── */}
        <div
          className={cn(
            "flex items-center gap-1 flex-shrink-0 transition-opacity",
            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <button
            onClick={() => setEditingTitle(true)}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            title="Redaktə et"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={deleteTask}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
            title="Sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Expanded subtasks ─────────────── */}
      {expanded && (
        <div className="bg-gray-50/40 border-b border-gray-100">
          {loadingSubtasks ? (
            <div className="flex items-center gap-2 pl-14 pr-4 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Yüklənir...
            </div>
          ) : (
            <>
              {(subtasks ?? []).map((sub) => (
                <SubtaskRow
                  key={sub.id}
                  subtask={sub}
                  members={members}
                  onUpdated={handleSubtaskUpdated}
                  onDeleted={handleSubtaskDeleted}
                />
              ))}
              <div className="pl-14 pr-4 py-1.5">
                <AddSubtaskRow
                  parentId={task.id}
                  projectId={task.projectId}
                  onCreated={handleSubtaskCreated}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function CheckCircleIcon() {
  return (
    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
    </div>
  );
}

// ── Group section ────────────────────────────────────────────────────────────
function GroupSection({
  title,
  color,
  tasks,
  projectId,
  members,
  onTaskUpdated,
  onTaskDeleted,
  onTaskCreated,
  onTaskClick,
  defaultStatus,
}: {
  title: string;
  color: string;
  tasks: KanbanTask[];
  projectId: string;
  members: TaskMember[];
  onTaskUpdated: (t: KanbanTask) => void;
  onTaskDeleted: (id: string) => void;
  onTaskCreated: (t: KanbanTask) => void;
  onTaskClick: (task: KanbanTask) => void;
  defaultStatus: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-2">
      {/* Group header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronDown
          className={cn("w-4 h-4 text-gray-400 transition-transform", collapsed && "-rotate-90")}
        />
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full ml-1">
          {tasks.length}
        </span>
      </div>

      {/* Task rows */}
      {!collapsed && (
        <div className="border border-gray-100 rounded-b-xl overflow-hidden mb-1">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              members={members}
              onUpdated={onTaskUpdated}
              onDeleted={onTaskDeleted}
              onTaskClick={onTaskClick}
            />
          ))}
          <div className="bg-white px-2 py-1.5">
            <AddTaskRow
              status={defaultStatus}
              projectId={projectId}
              onCreated={onTaskCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function TaskListView({
  projectId,
  tasks,
  members,
  labels,
  onTaskUpdated,
  onTaskDeleted,
  onTaskCreated,
  initialTaskId,
}: TaskListViewProps) {
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const openedInitialTask = useRef(false);

  useEffect(() => {
    if (openedInitialTask.current || !initialTaskId) return;
    const match = tasks.find((t) => t.id === initialTaskId);
    if (match) {
      setSelectedTask(match);
      openedInitialTask.current = true;
    }
  }, [initialTaskId, tasks]);

  const GROUPS = [
    { status: "BACKLOG",     ...STATUS_MAP.BACKLOG },
    { status: "TODO",        ...STATUS_MAP.TODO },
    { status: "IN_PROGRESS", ...STATUS_MAP.IN_PROGRESS },
    { status: "IN_REVIEW",   ...STATUS_MAP.IN_REVIEW },
    { status: "DONE",        ...STATUS_MAP.DONE },
    { status: "CANCELLED",   ...STATUS_MAP.CANCELLED },
  ];

  const handleSheetUpdated = useCallback((updatedTask: KanbanTask) => {
    onTaskUpdated(updatedTask);
    setSelectedTask(updatedTask);
  }, [onTaskUpdated]);

  const handleSheetDeleted = useCallback((taskId: string) => {
    onTaskDeleted(taskId);
    setSelectedTask(null);
  }, [onTaskDeleted]);

  return (
    <>
      <div className="h-full overflow-auto bg-gray-50/30">
        {/* Table header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
          <div className="w-4 flex-shrink-0" />
          <div className="w-4 flex-shrink-0" />
          <div className="w-24 flex-shrink-0" />
          <div className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tapşırıq Adı
          </div>
          <div className="w-28 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center flex-shrink-0">
            İcraçı
          </div>
          <div className="w-28 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right flex-shrink-0">
            Son Tarix
          </div>
          <div className="w-20 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right flex-shrink-0 hidden md:block">
            Prioritet
          </div>
          <div className="w-16 flex-shrink-0" />
        </div>

        {/* Groups */}
        <div className="p-4 space-y-1">
          {GROUPS.map((group) => {
            const groupTasks = tasks.filter((t) => t.status === group.status && !t.isArchived);
            return (
              <GroupSection
                key={group.status}
                title={group.label}
                color={group.color}
                tasks={groupTasks}
                projectId={projectId}
                members={members}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
                onTaskCreated={onTaskCreated}
                onTaskClick={(task) => setSelectedTask(task)}
                defaultStatus={group.status}
              />
            );
          })}
        </div>
      </div>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          members={members}
          labels={labels}
          onUpdated={handleSheetUpdated}
          onDeleted={handleSheetDeleted}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
