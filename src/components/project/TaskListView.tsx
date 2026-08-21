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
  MessageSquare,
  Paperclip,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDetailSheet } from "@/components/kanban/TaskDetailSheet";
import type { KanbanTask, TaskMember, KanbanLabel } from "@/components/kanban/types";
import { useSession } from "next-auth/react"; // YENİ: Tərcümə üçün
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki
import { toPlannerStatus } from "@/lib/task-status";

// ── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_MAP = {
  URGENT: { label: "Təcili", color: "text-red-500", bg: "bg-red-50 text-red-600 border border-red-200" },
  HIGH:   { label: "Yüksək", color: "text-orange-500", bg: "bg-orange-50 text-orange-600 border border-orange-200" },
  MEDIUM: { label: "Orta",   color: "text-amber-500", bg: "bg-amber-50 text-amber-600 border border-amber-200" },
  LOW:    { label: "Aşağı",  color: "text-gray-500",  bg: "bg-gray-50 text-gray-600 border border-gray-200" },
} as const;

const STATUS_MAP = {
  NOT_PLANNED: { label: "Not Planned", color: "#94a3b8", dot: "border-[#94a3b8]" },
  IN_PROGRESS: { label: "In Progress", color: "#f59e0b", dot: "border-[#f59e0b] bg-[#f59e0b]" },
  REVIEW:      { label: "Review",      color: "#8b5cf6", dot: "border-[#8b5cf6] bg-[#8b5cf6]" },
  DONE:        { label: "Done",        color: "#22c55e", dot: "border-[#22c55e] bg-[#22c55e]" },
  CANCELLED:   { label: "Cancelled",   color: "#ef4444", dot: "border-[#ef4444]" },
  TODO:        { label: "To Do",       color: "#6366f1", dot: "border-[#6366f1]" },
  BACKLOG:     { label: "Backlog",     color: "#94a3b8", dot: "border-[#94a3b8]" },
  IN_REVIEW:   { label: "In Review",   color: "#8b5cf6", dot: "border-[#8b5cf6] bg-[#8b5cf6]" },
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
  t // YENİ
}: {
  status: string;
  projectId: string;
  onCreated: (task: KanbanTask) => void;
  t: any; // YENİ
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
        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-blue-600 hover:bg-blue-50/50 transition-colors rounded-lg mt-1"
      >
        <Plus className="w-4 h-4" />
        {t("taskListView.addTaskBtn") || "Tapşırıq əlavə et"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50/50 rounded-lg border border-blue-200 mt-1 shadow-sm">
      <Circle className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setOpen(false); setTitle(""); }
        }}
        placeholder={t("taskListView.addTaskPlaceholder") || "Tapşırıq adı yazın, Enter-ə basın..."}
        className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-blue-400/70"
        disabled={loading}
      />
      {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
      <button onClick={() => { setOpen(false); setTitle(""); }} className="text-xs font-semibold text-gray-500 hover:text-gray-800">
        {t("taskListView.cancel") || "Ləğv et"}
      </button>
    </div>
  );
}

// ── Inline quick-add row (subtasks, nested under a parent) ──────────────────
function AddSubtaskRow({
  parentId,
  projectId,
  onCreated,
  t // YENİ
}: {
  parentId: string;
  projectId: string;
  onCreated: (task: SubtaskItem) => void;
  t: any; // YENİ
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
        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-blue-600 hover:bg-blue-50/50 transition-colors rounded-lg mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("taskListView.addSubtaskBtn") || "Alt tapşırıq əlavə et"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-200 mt-1">
      <Circle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setOpen(false); setTitle(""); }
        }}
        placeholder={t("taskListView.addSubtaskPlaceholder") || "Alt tapşırıq adı yazın, Enter-ə basın..."}
        className="flex-1 bg-transparent text-xs outline-none placeholder:text-blue-400/70"
        disabled={loading}
      />
      {loading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
      <button onClick={() => { setOpen(false); setTitle(""); }} className="text-[11px] font-semibold text-gray-500 hover:text-gray-800">
        {t("taskListView.cancel") || "Ləğv et"}
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
  t // YENİ
}: {
  taskId: string;
  status: string;
  onChanged: (raw: any) => void;
  compact?: boolean;
  t: any; // YENİ
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
    <div className="relative flex-shrink-0 w-full">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "rounded-md font-semibold border transition-colors hover:opacity-80 flex items-center justify-center w-full",
          compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-1"
        )}
        style={{
          borderColor: st?.color,
          color: st?.color,
          backgroundColor: `${st?.color}15`,
        }}
      >
        {t(`status.${status}`) || st?.label}
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-20 bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-1 w-36">
          {(["NOT_PLANNED", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"] as const).map((key) => {
            const val = STATUS_MAP[key];
            return (
            <button
              key={key}
              onClick={() => changeStatus(key)}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[11px] font-medium rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: val.color }}
              />
              {t(`status.${key}`) || val.label}
            </button>
            );
          })}
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
  t // YENİ
}: {
  taskId: string;
  assignee?: { id: string; name: string | null; avatar?: string | null } | null;
  members: TaskMember[];
  onChanged: (raw: any) => void;
  compact?: boolean;
  t: any; // YENİ
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
    <div className="relative flex-shrink-0 flex items-center justify-center w-full">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity rounded-md"
        title={t("taskListView.titleAssignee") || "İcraçını dəyiş"}
      >
        {assignee ? (
          <>
            <Avatar className={avatarSize}>
              <AvatarImage src={assignee.avatar ?? undefined} />
              <AvatarFallback className={cn("bg-blue-100 text-blue-700 font-medium", compact ? "text-[9px]" : "text-[10px]")}>
                {getInitials(assignee.name ?? "")}
              </AvatarFallback>
            </Avatar>
            {!compact && (
              <span className="text-[12px] font-medium text-gray-700 hidden xl:block truncate max-w-[80px]">
                {assignee.name?.split(" ")[0]}
              </span>
            )}
          </>
        ) : (
          <div className={cn(avatarSize, "rounded-full border border-dashed border-gray-400 flex items-center justify-center hover:border-gray-600 transition-colors bg-gray-50")}>
            <User className="w-3 h-3 text-gray-400" />
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-1 w-48 max-h-56 overflow-y-auto">
          <button
            onClick={() => assign(null)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50 transition-colors text-left text-gray-500 font-medium"
          >
            <div className="w-5 h-5 rounded-full border border-dashed border-gray-400 flex items-center justify-center flex-shrink-0 bg-gray-50">
              <User className="w-3 h-3 text-gray-400" />
            </div>
            {t("taskListView.notAssigned") || "Təyin edilməyib"}
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => assign(m.id)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50 transition-colors text-left font-medium text-gray-700"
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={m.avatar ?? undefined} />
                <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">{getInitials(m.name)}</AvatarFallback>
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
  t // YENİ
}: {
  taskId: string;
  dueDate?: Date | string | null;
  isDone?: boolean;
  onChanged: (raw: any) => void;
  compact?: boolean;
  t: any; // YENİ
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
    <div className="relative flex-shrink-0 flex justify-end w-full">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-md hover:bg-gray-100 transition-colors px-2 py-1",
          compact ? "text-[11px]" : "text-[12px] font-medium",
          isOverdue ? "text-red-600 bg-red-50" : dueDate ? "text-gray-600" : "text-gray-400"
        )}
        title={t("taskListView.titleDate") || "Son tarixi dəyiş"}
      >
        <Calendar className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
        {dueDate ? format(new Date(dueDate), "dd MMM") : "—"}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-3 w-52">
          <input
            type="date"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-400"
          />
          <div className="flex items-center justify-between mt-3">
            <button onClick={() => save("")} className="text-[11px] font-semibold text-gray-500 hover:text-red-500">
              {t("taskListView.clearDate") || "Təmizlə"}
            </button>
            <button onClick={() => save(val)} className="text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md">
              {t("taskListView.confirmDate") || "Təsdiqlə"}
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
  t // YENİ
}: {
  subtask: SubtaskItem;
  members: TaskMember[];
  onUpdated: (raw: any) => void;
  onDeleted: (id: string) => void;
  t: any; // YENİ
}) {
  const [hovered, setHovered] = useState(false);
  const dot = STATUS_MAP[subtask.status as keyof typeof STATUS_MAP];

  const deleteSub = async () => {
    if (!confirm(t("taskListView.confirmSubtaskDelete") || "Bu alt tapşırığı silmək istədiyinizə əminsiniz?")) return;
    try {
      await fetch(`/api/tasks/${subtask.id}`, { method: "DELETE" });
      onDeleted(subtask.id);
    } catch (e) { console.error(e); }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-1.5 border-t border-gray-100/70 transition-colors",
        hovered ? "bg-white shadow-sm" : "bg-transparent",
        subtask.status === "DONE" && "opacity-60"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Alignment Spacers */}
      <div className="w-5 flex-shrink-0" />
      {/* Visual icon only, not clickable anymore */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        <div title={subtask.status === "DONE" ? (t("status.DONE") || "Tamamlandı") : (t("status.TODO") || "Gözləyir")}>
          {subtask.status === "DONE" ? (
            <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className={cn("w-3.5 h-3.5 rounded-full border-2", dot?.dot ?? "border-gray-300")} />
          )}
        </div>
      </div>

      <div className="w-28 flex-shrink-0">
        <StatusBadge taskId={subtask.id} status={subtask.status} onChanged={onUpdated} compact t={t} />
      </div>

      <span className={cn("flex-1 min-w-0 text-[13px] font-medium text-gray-700 truncate", subtask.status === "DONE" && "line-through text-gray-400")}>
        {subtask.title}
      </span>

      <div className="w-24 flex-shrink-0" /> {/* Indicators Placeholder */}

      <div className="w-32 flex-shrink-0 flex justify-center">
        <AssigneeCell taskId={subtask.id} assignee={subtask.assignee} members={members} onChanged={onUpdated} compact t={t} />
      </div>

      <div className="w-28 flex-shrink-0 flex justify-end">
        <DueDateCell taskId={subtask.id} dueDate={subtask.dueDate} isDone={subtask.status === "DONE"} onChanged={onUpdated} compact t={t} />
      </div>

      <div className="w-24 hidden md:block flex-shrink-0" /> {/* Priority Placeholder */}

      <div className="w-16 flex justify-end pr-2 flex-shrink-0">
        <button
          onClick={deleteSub}
          className={cn("p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all", hovered ? "opacity-100" : "opacity-0 pointer-events-none")}
          title={t("taskListView.titleDelete") || "Sil"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
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
  t // YENİ
}: {
  task: KanbanTask;
  members: TaskMember[];
  onUpdated: (t: KanbanTask) => void;
  onDeleted: (id: string) => void;
  onTaskClick: (task: KanbanTask) => void;
  t: any; // YENİ
}) {
  const [hovered, setHovered] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);

  // ── Subtasks logic
  const [expanded, setExpanded] = useState(false);
  const [subtasks, setSubtasks] = useState<SubtaskItem[] | null>(null);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  const prio = PRIORITY_MAP[task.priority as keyof typeof PRIORITY_MAP] ?? PRIORITY_MAP.MEDIUM;

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
    if (!confirm(t("taskListView.confirmTaskDelete") || "Bu tapşırığı silmək istədiyinizə əminsiniz?")) return;
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      onDeleted(task.id);
    } catch (e) { console.error(e); }
  };

  // ── Indicators Logic
  const subtaskCount = subtasks?.length ?? task._count?.subtasks ?? 0;
  const doneSubtasks = (subtasks ?? []).filter((s) => s.status === "DONE").length;
  const commentCount = task._count?.comments ?? 0;
  const fileCount = task._count?.attachments ?? 0;

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 transition-all",
          hovered ? "bg-slate-50 shadow-sm z-10 relative" : "bg-white",
          task.status === "DONE" && "opacity-60"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 1. Expand Toggle */}
        <div className="w-5 flex-shrink-0 flex items-center justify-center">
          {subtaskCount > 0 ? (
            <button
              onClick={toggleExpand}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")} />
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}
        </div>

        {/* 2. Status Icon (Sırf vizual, basıla bilməz) */}
        <div className="w-6 flex-shrink-0 flex items-center justify-center">
          <div className="flex-shrink-0" title={task.status === "DONE" ? (t("status.DONE") || "Tamamlandı") : (t("status.TODO") || "Gözləyir")}>
            {task.status === "DONE" ? (
              <CheckCircleIcon />
            ) : (
              <div className={cn("w-4 h-4 rounded-full border-2", STATUS_MAP[task.status as keyof typeof STATUS_MAP]?.dot ?? "border-gray-300")} />
            )}
          </div>
        </div>

        {/* 3. Status Badge */}
        <div className="w-28 flex-shrink-0">
          <StatusBadge taskId={task.id} status={task.status} onChanged={(raw) => onUpdated({ ...task, ...raw })} t={t} />
        </div>

        {/* 4. Title & Labels */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {editingTitle ? (
            <input
              autoFocus
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setTitleVal(task.title); setEditingTitle(false); } }}
              className="w-full text-sm bg-transparent border-b-2 border-blue-500 outline-none font-medium text-slate-900"
            />
          ) : (
            <span
              className={cn(
                "text-[14px] font-semibold text-slate-800 truncate cursor-pointer hover:text-blue-600 transition-colors",
                task.status === "DONE" && "line-through text-slate-400"
              )}
              onClick={() => onTaskClick(task)}
              onDoubleClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
            >
              {task.title}
            </span>
          )}
          {task.labels && task.labels.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0 ml-2">
              {task.labels.slice(0, 2).map(({ label }) => (
                <span key={label.id} className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider" style={{ backgroundColor: `${label.color}15`, color: label.color }}>
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 5. Indicators (Subtasks, Comments, Files) */}
        <div className="w-24 flex-shrink-0 flex items-center gap-3 text-[11px] font-bold text-gray-400">
          {subtaskCount > 0 && (
            <div className="flex items-center gap-1" title={`${doneSubtasks}/${subtaskCount} alt tapşırıq`}>
              <Check className="w-3.5 h-3.5" />
              <span className={doneSubtasks === subtaskCount ? "text-green-500" : ""}>{doneSubtasks}/{subtaskCount}</span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1" title={`${commentCount} şərh`}>
              <MessageSquare className="w-3.5 h-3.5" /> <span>{commentCount}</span>
            </div>
          )}
          {fileCount > 0 && (
            <div className="flex items-center gap-1" title={`${fileCount} fayl`}>
              <Paperclip className="w-3.5 h-3.5" /> <span>{fileCount}</span>
            </div>
          )}
        </div>

        {/* 6. Assignee */}
        <div className="w-32 flex-shrink-0 flex justify-center">
          <AssigneeCell taskId={task.id} assignee={task.assignee} members={members} onChanged={(raw) => onUpdated({ ...task, ...raw })} t={t} />
        </div>

        {/* 7. Due Date */}
        <div className="w-28 flex-shrink-0 flex justify-end">
          <DueDateCell taskId={task.id} dueDate={task.dueDate} isDone={task.status === "DONE"} onChanged={(raw) => onUpdated({ ...task, ...raw })} t={t} />
        </div>

        {/* 8. Priority */}
        <div className="w-24 flex-shrink-0 hidden md:flex justify-end">
          <span className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider", prio.bg)}>
            {t(`priority.${task.priority}`) || prio.label}
          </span>
        </div>

        {/* 9. Actions */}
        <div className={cn("w-16 flex-shrink-0 flex items-center justify-end gap-1 transition-opacity pr-2", hovered ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <button onClick={() => setEditingTitle(true)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors" title={t("taskListView.titleEdit") || "Redaktə et"}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={deleteTask} className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors" title={t("taskListView.titleDelete") || "Sil"}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Expanded subtasks ─────────────── */}
      {expanded && (
        <div className="bg-slate-50/50 border-b border-gray-100 py-1 shadow-inner">
          {loadingSubtasks ? (
            <div className="flex items-center gap-2 pl-14 pr-4 py-2 text-xs font-medium text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> {t("taskListView.loadingSubtasks") || "Alt tapşırıqlar yüklənir..."}
            </div>
          ) : (
            <>
              {(subtasks ?? []).map((sub) => (
                <SubtaskRow key={sub.id} subtask={sub} members={members} onUpdated={handleSubtaskUpdated} onDeleted={handleSubtaskDeleted} t={t} />
              ))}
              <div className="pl-14 pr-4 py-1.5">
                <AddSubtaskRow parentId={task.id} projectId={task.projectId} onCreated={handleSubtaskCreated} t={t} />
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
  t // YENİ
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
  t: any; // YENİ
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* Group header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors bg-slate-50/80 border-b border-gray-100"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", collapsed && "-rotate-90")} />
        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
        <span className="text-[14px] font-bold text-slate-800 tracking-tight">{title}</span>
        <span className="text-[11px] font-bold text-slate-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full ml-2 shadow-sm">
          {tasks.length}
        </span>
      </div>

      {/* Task rows */}
      {!collapsed && (
        <div className="flex flex-col">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              members={members}
              onUpdated={onTaskUpdated}
              onDeleted={onTaskDeleted}
              onTaskClick={onTaskClick}
              t={t}
            />
          ))}
          <div className="px-3 py-2 bg-white rounded-b-xl">
            <AddTaskRow status={defaultStatus} projectId={projectId} onCreated={onTaskCreated} t={t} />
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
  // YENİ: Dili tapıb tərcümə obyektini formalaşdırırıq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

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
    { status: "NOT_PLANNED", ...STATUS_MAP.NOT_PLANNED, label: t("status.NOT_PLANNED") || "Not Planned" },
    { status: "IN_PROGRESS", ...STATUS_MAP.IN_PROGRESS, label: t("status.IN_PROGRESS") || "In Progress" },
    { status: "REVIEW",      ...STATUS_MAP.REVIEW,      label: t("status.REVIEW") || "Review" },
    { status: "DONE",        ...STATUS_MAP.DONE,        label: t("status.DONE") || "Done" },
    { status: "CANCELLED",   ...STATUS_MAP.CANCELLED,   label: t("status.CANCELLED") || "Cancelled" },
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
      <div className="h-full overflow-auto bg-slate-50/50">
        {/* Table header (Fixed Widths for Perfect Alignment) */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-5 flex-shrink-0" />
          <div className="w-6 flex-shrink-0" />
          <div className="w-28 flex-shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            {t("taskListView.tableStatus") || "Status"}
          </div>
          <div className="flex-1 min-w-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            {t("taskListView.tableTaskName") || "Tapşırıq Adı"}
          </div>
          <div className="w-24 flex-shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t("taskListView.tableInfo") || "Məlumat"}
          </div>
          <div className="w-32 flex-shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            {t("taskListView.tableAssignee") || "İcraçı"}
          </div>
          <div className="w-28 flex-shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
            {t("taskListView.tableDueDate") || "Son Tarix"}
          </div>
          <div className="w-24 flex-shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right hidden md:block">
            {t("taskListView.tablePriority") || "Prioritet"}
          </div>
          <div className="w-16 flex-shrink-0" />
        </div>

        {/* Groups */}
        <div className="p-6 max-w-[1600px] mx-auto space-y-2">
          {GROUPS.map((group) => {
            const groupTasks = tasks.filter((item) => {
              if (item.isArchived) return false;
              if (group.status === "CANCELLED") return item.status === "CANCELLED";
              return item.status !== "CANCELLED" && toPlannerStatus(item.status) === group.status;
            });
            if (groupTasks.length === 0 && group.status !== "NOT_PLANNED" && group.status !== "IN_PROGRESS") return null;

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
                onTaskClick={(task: KanbanTask) => setSelectedTask(task)}
                defaultStatus={group.status}
                t={t} // YENİ: Alt komponentlərə t-ni ötürürük
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