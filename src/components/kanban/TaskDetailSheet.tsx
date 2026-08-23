"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n"; // YENİ
import {
  X, Loader2, Trash2, Calendar, User, Clock,
  MessageSquare, Paperclip, CheckSquare, AlertTriangle,
  Edit2, Check, Plus, FileText, Timer, Send,
  Reply, Pencil, Archive, ArchiveRestore, MoreVertical,
  Download, File as FileIcon, Image as ImageIcon, Eye,
} from "lucide-react";
import { cn, getPriorityColor, getStatusColor, timeAgo, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadButton } from "@/utils/uploadthing";
import type { KanbanTask, TaskMember } from "./types";
import { ObserverMultiSelect } from "./ObserverMultiSelect";

// ─── Constants (Dynamic) ───────────────────────────────────────────────────
const getStatusOptions = (t: any, current?: string) => {
  const options = [
    { value: "NOT_PLANNED", label: t("taskDetailSheet.statusNotPlanned") || "Not Planned", color: "#94a3b8" },
    { value: "IN_PROGRESS", label: t("taskDetailSheet.statusInProgress") || "İcra Edilir", color: "#f59e0b" },
    { value: "REVIEW",      label: t("taskDetailSheet.statusReview") || "Yoxlanılır",    color: "#8b5cf6" },
    { value: "DONE",        label: t("taskDetailSheet.statusDone") || "Tamamlandı",      color: "#22c55e" },
    { value: "CANCELLED",   label: t("taskDetailSheet.statusCancelled") || "Ləğv Edildi",   color: "#ef4444" },
  ];
  if (current && !options.some((o) => o.value === current)) {
    options.unshift({
      value: current,
      label: t(`status.${current}`) || current,
      color: "#94a3b8",
    });
  }
  return options;
};

const getPriorityOptions = (t: any) => [
  { value: "LOW",    label: t("taskDetailSheet.priorityLow") || "Aşağı",    color: "#94a3b8" },
  { value: "MEDIUM", label: t("taskDetailSheet.priorityMedium") || "Orta",     color: "#f59e0b" },
  { value: "HIGH",   label: t("taskDetailSheet.priorityHigh") || "Yüksək",   color: "#f97316" },
  { value: "URGENT", label: t("taskDetailSheet.priorityUrgent") || "Təcili",   color: "#ef4444" },
];

type TabId = "details" | "subtasks" | "comments" | "files" | "time";

const getSheetTabs = (t: any) => [
  { id: "details" as TabId,  label: t("taskDetailSheet.tabDetails") || "Detallar",        icon: FileText },
  { id: "subtasks" as TabId, label: t("taskDetailSheet.tabSubtasks") || "Alt Tapşırıqlar", icon: CheckSquare },
  { id: "comments" as TabId, label: t("taskDetailSheet.tabComments") || "Şərhlər",        icon: MessageSquare },
  { id: "files" as TabId,    label: t("taskDetailSheet.tabFiles") || "Fayllar",         icon: Paperclip },
  { id: "time" as TabId,     label: t("taskDetailSheet.tabTime") || "Vaxt",            icon: Timer },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Comment mətnindəki "@Ad Soyad" mention-larını qalın/rəngli render edir. */
function renderMentionedContent(content: string, mentionedUserIds: string[], members: TaskMember[]) {
  if (!mentionedUserIds?.length) return content;
  const names = mentionedUserIds
    .map((id) => members.find((m) => m.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  if (!names.length) return content;

  const sorted = [...new Set(names)].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(@(?:${escaped.join("|")}))`, "g");
  const parts = content.split(pattern);

  return parts.map((part, i) =>
    sorted.some((n) => part === `@${n}`) ? (
      <strong key={i} className="text-primary bg-primary/10 rounded px-1 font-semibold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface TaskDetailSheetProps {
  task: KanbanTask;
  members: TaskMember[];
  onUpdated: (task: KanbanTask) => void;
  onDeleted: (taskId: string) => void;
  onClose: () => void;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function TaskDetailSheet({
  task,
  members,
  onUpdated,
  onDeleted,
  onClose,
}: TaskDetailSheetProps) {
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Editable form state
  const [editingTitle, setEditingTitle] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    assigneeId: task.assignee?.id ?? "",
    observerIds: (task.observers ?? []).map((o) => o.id),
    dueDate: formatDate(task.dueDate),
    estimatedHours: task.estimatedHours ?? null,
  });

  const STATUS_OPTIONS = getStatusOptions(t, form.status);
  const PRIORITY_OPTIONS = getPriorityOptions(t);
  const SHEET_TABS = getSheetTabs(t);

  // Tab-level count overrides
  const [counts, setCounts] = useState(task._count);

  // ── API helper ─────────────────────────────────────────────
  const patchField = useCallback(
    async (field: string, value: unknown) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value ?? null }),
        });
        if (res.ok) {
          const data = await res.json();
          onUpdated({ ...data, _count: counts });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [task.id, onUpdated, counts]
  );

  const handleChange = (field: string) => async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    await patchField(field, val);
  };

  const handleSelectField = (field: string) => async (val: string) => {
    setForm((p) => ({ ...p, [field]: val }));
    await patchField(field, val);
  };

  const handleTitleSave = async () => {
    if (!form.title.trim()) return;
    setEditingTitle(false);
    await patchField("title", form.title.trim());
  };

  const handleDelete = async () => {
    if (!confirm(t("taskDetailSheet.confirmDeleteTask") || "Bu tapşırığı silmək istədiyinizə əminsiniz?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) onDeleted(task.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveToggle = async () => {
    setArchiving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !task.isArchived }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated({ ...data, _count: counts });
      }
    } finally {
      setArchiving(false);
    }
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === form.status);
  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === form.priority);

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-2xl">

        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border">
          <SheetTitle className="sr-only">{t("taskDetailSheet.srOnlyTitle") || "Tapşırıq Detalları"}</SheetTitle>

          {/* Title row */}
          <div className="flex items-start gap-3 pr-8">
            {/* Status dot */}
            <button
              className="mt-1.5 flex-shrink-0"
              onClick={async () => {
                const next = form.status === "DONE" ? "NOT_PLANNED" : "DONE";
                setForm((p) => ({ ...p, status: next }));
                await patchField("status", next);
              }}
            >
              {form.status === "DONE" ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              ) : (
                <div
                  className="w-5 h-5 rounded-full border-2"
                  style={{ borderColor: currentStatus?.color }}
                />
              )}
            </button>

            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                    onBlur={handleTitleSave}
                    autoFocus
                    className="w-full text-lg font-semibold bg-transparent border-b-2 border-primary outline-none text-foreground"
                  />
                </div>
              ) : (
                <h2
                  className={cn(
                    "text-lg font-semibold cursor-pointer group flex items-center gap-2 hover:text-primary transition-colors text-foreground",
                    form.status === "DONE" && "line-through text-muted-foreground"
                  )}
                  onClick={() => setEditingTitle(true)}
                >
                  {form.title}
                  <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40" />
                </h2>
              )}
              {/* Meta row under title */}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {task.createdAt && <span>{t("taskDetailSheet.createdText") || "Yaradılıb"} {timeAgo(new Date(task.createdAt))}</span>}
                {task.isArchived && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 font-medium">
                    {t("taskDetailSheet.archived") || "Arxivləşdirilib"}
                  </span>
                )}
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            </div>
          </div>

          {/* Quick action pills */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              {t("taskDetailSheet.deleteBtn") || "Sil"}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handleArchiveToggle} disabled={archiving}>
                  {task.isArchived ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5 mr-2" /> {t("taskDetailSheet.unarchive") || "Arxivdən çıxar"}
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5 mr-2" /> {t("taskDetailSheet.archive") || "Arxivləşdir"}
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ─── Tab Bar ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-b border-border bg-muted/30 px-6">
          <div className="flex items-center gap-0.5 -mb-px">
            {SHEET_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count =
                tab.id === "subtasks" ? counts.subtasks :
                tab.id === "comments" ? counts.comments :
                tab.id === "files" ? counts.attachments : null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {count !== null && count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                      isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Tab Content ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "details" && (
            <DetailsTab
              form={form}
              setForm={setForm}
              members={members}
              currentStatus={currentStatus}
              currentPriority={currentPriority}
              handleChange={handleChange}
              handleSelectField={handleSelectField}
              patchField={patchField}
              task={task}
              t={t}
            />
          )}

          {activeTab === "subtasks" && (
            <SubtasksTab
              task={task}
              onCountChange={(n) => setCounts((c) => ({ ...c, subtasks: n }))}
              t={t}
            />
          )}

          {activeTab === "comments" && (
            <CommentsTab
              taskId={task.id}
              members={members}
              onCountChange={(n) => setCounts((c) => ({ ...c, comments: n }))}
              t={t}
            />
          )}

          {activeTab === "files" && (
            <FilesTab
              taskId={task.id}
              onCountChange={(n) => setCounts((c) => ({ ...c, attachments: n }))}
              t={t}
            />
          )}

          {activeTab === "time" && (
            <TimeTab estimatedHours={form.estimatedHours} t={t} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Details
// ═══════════════════════════════════════════════════════════════════════════
function DetailsTab({
  form, setForm, members, currentStatus, currentPriority,
  handleChange, handleSelectField, patchField, task, t
}: any) {
  const STATUS_OPTIONS = getStatusOptions(t, form.status);
  const PRIORITY_OPTIONS = getPriorityOptions(t);

  return (
    <div className="p-6 space-y-6">
      {/* ── Properties Grid ──────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("taskDetailSheet.features") || "Xüsusiyyətlər"}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Status */}
          <PropertyField label={t("taskDetailSheet.statusLabel") || "Status"} icon={<AlertTriangle className="w-3.5 h-3.5" />}>
            <Select value={form.status} onValueChange={handleSelectField("status")}>
              <SelectTrigger className="w-full bg-background border-input text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PropertyField>

          {/* Priority */}
          <PropertyField label={t("taskDetailSheet.priorityLabel") || "Prioritet"} icon={<AlertTriangle className="w-3.5 h-3.5" />}>
            <Select value={form.priority} onValueChange={handleSelectField("priority")}>
              <SelectTrigger className="w-full bg-background border-input text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PropertyField>

          {/* Assignee */}
          <PropertyField label={t("taskDetailSheet.assigneeLabel") || "İcraçı"} icon={<User className="w-3.5 h-3.5" />}>
            <Select
              value={form.assigneeId || "__none__"}
              onValueChange={(v) => handleSelectField("assigneeId")(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="w-full bg-background border-input text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("taskDetailSheet.notSelected") || "Seçilməyib"}</SelectItem>
                {members.map((m: TaskMember) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PropertyField>

          {/* Observers */}
          <div className="col-span-2">
          <PropertyField label={t("taskDetailSheet.observersLabel") || "Müşahidəçilər"} icon={<Eye className="w-3.5 h-3.5" />}>
            <ObserverMultiSelect
              members={members}
              selectedIds={form.observerIds}
              excludeId={form.assigneeId || undefined}
              onChange={async (ids) => {
                setForm((p: any) => ({ ...p, observerIds: ids }));
                await patchField("observerIds", ids);
              }}
              placeholder={t("taskDetailSheet.observersPlaceholder") || "Müşahidəçi seçin"}
            />
          </PropertyField>
          </div>

          {/* Due date */}
          <PropertyField label={t("taskDetailSheet.dueDateLabel") || "Son Tarix"} icon={<Calendar className="w-3.5 h-3.5" />}>
            <input
              type="date"
              value={form.dueDate}
              onChange={handleChange("dueDate")}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
            />
          </PropertyField>
        </div>
      </div>

      {/* ── Description ──────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("taskDetailSheet.description") || "Təsvir"}
        </h3>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
          onBlur={() => patchField("description", form.description)}
          rows={5}
          placeholder={t("taskDetailSheet.descPlaceholder") || "Tapşırıq haqqında ətraflı yazın..."}
          className="w-full px-4 py-3 rounded-xl border border-input bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary focus:bg-background transition-all resize-none leading-relaxed"
        />
      </div>

      {/* ── Estimated Hours ──────────────────────────────────── */}
      <PropertyField label={t("taskDetailSheet.estimatedTime") || "Təxmini Vaxt (saat)"} icon={<Clock className="w-3.5 h-3.5" />}>
        <input
          type="number"
          min={0}
          step={0.5}
          defaultValue={task.estimatedHours ?? ""}
          onBlur={(e) => patchField("estimatedHours", e.target.value ? Number(e.target.value) : null)}
          placeholder="0"
          className="w-32 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
        />
      </PropertyField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Subtasks
// ═══════════════════════════════════════════════════════════════════════════
interface SubtaskItem {
  id: string;
  title: string;
  status: string;
}

function SubtasksTab({
  task,
  onCountChange,
  t,
}: {
  task: KanbanTask;
  onCountChange: (count: number) => void;
  t: any;
}) {
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadSubtasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      if (res.ok) {
        const data = await res.json();
        const loaded = data.subtasks ?? [];
        setSubtasks(loaded);
        onCountChange(loaded.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  useEffect(() => {
    loadSubtasks();
  }, [loadSubtasks]);

  const addSubtask = async () => {
    const title = subtaskTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    setSubtaskTitle("");

    const tempId = `temp-${Date.now()}`;
    setSubtasks((prev) => {
      const next = [...prev, { id: tempId, title, status: "NOT_PLANNED" }];
      onCountChange(next.length);
      return next;
    });

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, projectId: task.projectId, parentId: task.id }),
      });
      if (!res.ok) throw new Error("failed");
      const created = await res.json();
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === tempId ? { id: created.id, title: created.title, status: created.status } : s
        )
      );
    } catch (e) {
      console.error(e);
      setSubtasks((prev) => {
        const next = prev.filter((s) => s.id !== tempId);
        onCountChange(next.length);
        return next;
      });
      setSubtaskTitle(title);
    } finally {
      setCreating(false);
    }
  };

  const toggleSubtask = async (sub: SubtaskItem) => {
    const newStatus = sub.status === "DONE" ? "NOT_PLANNED" : "DONE";
    setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s)));
    try {
      const res = await fetch(`/api/tasks/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("failed");
    } catch (e) {
      console.error(e);
      setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: sub.status } : s)));
    }
  };

  const deleteSubtask = async (sub: SubtaskItem) => {
    setSubtasks((prev) => {
      const next = prev.filter((s) => s.id !== sub.id);
      onCountChange(next.length);
      return next;
    });
    try {
      const res = await fetch(`/api/tasks/${sub.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
    } catch (e) {
      console.error(e);
      setSubtasks((prev) => {
        const next = [...prev, sub];
        onCountChange(next.length);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {(t("taskDetailSheet.subtasksTitle") || "Alt Tapşırıqlar ({count})").replace("{count}", String(subtasks.length))}
      </h3>

      {/* Existing subtasks */}
      <div className="space-y-1">
        {subtasks.map((sub) => (
          <div key={sub.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group">
            <button
              onClick={() => toggleSubtask(sub)}
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer",
                sub.status === "DONE"
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-muted-foreground/40 group-hover:border-primary"
              )}
            >
              {sub.status === "DONE" && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </button>
            <span className={cn(
              "text-sm flex-1 text-foreground",
              sub.status === "DONE" && "line-through text-muted-foreground"
            )}>
              {sub.title}
            </span>
            <button
              onClick={() => deleteSubtask(sub)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
              title={t("taskDetailSheet.deleteBtn") || "Sil"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add subtask */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border bg-muted/30 hover:border-primary hover:bg-primary/5 transition-colors">
        {creating ? (
          <Loader2 className="w-4 h-4 text-primary flex-shrink-0 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <input
          value={subtaskTitle}
          onChange={(e) => setSubtaskTitle(e.target.value)}
          placeholder={t("taskDetailSheet.addSubtaskPlaceholder") || "Alt tapşırıq əlavə et..."}
          disabled={creating}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
          onKeyDown={(e) => {
            if (e.key === "Enter") addSubtask();
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared: Mention-aware textarea with a simple @name autocomplete dropdown
// ═══════════════════════════════════════════════════════════════════════════
function MentionTextarea({
  value,
  onChange,
  members,
  placeholder,
  rows = 2,
  onSubmit,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  members: TaskMember[];
  placeholder: string;
  rows?: number;
  onSubmit: () => void;
  autoFocus?: boolean;
}) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = members
    .filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, 5);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@([^\s@]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const idx = before.lastIndexOf("@");
    if (idx === -1) return;
    const newVal = `${value.slice(0, idx)}@${name} ${value.slice(cursor)}`;
    onChange(newVal);
    setShowMentions(false);
    requestAnimationFrame(() => el?.focus());
  };

  return (
    <div className="relative flex-1">
      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-30 py-1 max-h-40 overflow-y-auto">
          {filteredMembers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => insertMention(m.name)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors text-foreground"
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={m.avatar ?? undefined} />
                <AvatarFallback className="text-[8px]">{getInitials(m.name)}</AvatarFallback>
              </Avatar>
              {m.name}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !showMentions) {
            e.preventDefault();
            onSubmit();
          }
          if (e.key === "Escape") setShowMentions(false);
        }}
        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all resize-none"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Comments
// ═══════════════════════════════════════════════════════════════════════════
interface CommentItem {
  id: string;
  content: string;
  isEdited: boolean;
  mentionedUserIds: string[];
  parentId: string | null;
  createdAt: string;
  authorId: string;
  author: { id: string; name: string; avatar?: string | null };
}

function CommentsTab({
  taskId,
  members,
  onCountChange,
  t,
}: {
  taskId: string;
  members: TaskMember[];
  onCountChange: (count: number) => void;
  t: any;
}) {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const currentUserId: string | undefined = currentUser?.id;
  const canDeleteAny: boolean = (currentUser?.role?.permissions ?? []).includes("CAN_DELETE_ANY_COMMENT");

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
        onCountChange(data.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitComment = async (content: string, parentId: string | null, onSuccess: () => void) => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: CommentItem = {
      id: tempId,
      content: trimmed,
      isEdited: false,
      mentionedUserIds: [],
      parentId,
      createdAt: new Date().toISOString(),
      authorId: currentUserId ?? "",
      author: {
        id: currentUserId ?? "",
        name: currentUser?.name ?? (t("taskDetailSheet.me") || "Mən"),
        avatar: currentUser?.image,
      },
    };
    setComments((prev) => {
      const next = [...prev, optimistic];
      onCountChange(next.length);
      return next;
    });
    onSuccess();

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, parentId }),
      });
      if (!res.ok) throw new Error("failed");
      const created = await res.json();
      setComments((prev) => prev.map((c) => (c.id === tempId ? created : c)));
    } catch (e) {
      console.error(e);
      setComments((prev) => {
        const next = prev.filter((c) => c.id !== tempId);
        onCountChange(next.length);
        return next;
      });
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async (comment: CommentItem) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    const prevContent = comment.content;
    setComments((prev) =>
      prev.map((c) => (c.id === comment.id ? { ...c, content: trimmed, isEdited: true } : c))
    );
    setEditingId(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) throw new Error("failed");
      const updated = await res.json();
      setComments((prev) => prev.map((c) => (c.id === comment.id ? updated : c)));
    } catch (e) {
      console.error(e);
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, content: prevContent } : c))
      );
    }
  };

  const deleteComment = async (comment: CommentItem) => {
    if (!confirm(t("taskDetailSheet.confirmDeleteComment") || "Bu şərhi silmək istədiyinizə əminsiniz?")) return;
    const snapshot = comments;
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== comment.id && c.parentId !== comment.id);
      onCountChange(next.length);
      return next;
    });
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments/${comment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
    } catch (e) {
      console.error(e);
      setComments(snapshot);
      onCountChange(snapshot.length);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  const renderComment = (comment: CommentItem, depth: number) => {
    const isOwn = comment.authorId === currentUserId;
    const canDelete = isOwn || canDeleteAny;
    const isEditing = editingId === comment.id;
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={cn("flex gap-3", depth > 0 && "ml-10 mt-3")}>
        <Avatar className="w-7 h-7 flex-shrink-0">
          <AvatarImage src={comment.author?.avatar ?? undefined} />
          <AvatarFallback className="text-[10px]">
            {getInitials(comment.author?.name ?? "?")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-foreground">{comment.author?.name}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(new Date(comment.createdAt))}</span>
            {comment.isEdited && <span className="text-[10px] text-muted-foreground">{t("taskDetailSheet.edited") || "(redaktə edilib)"}</span>}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <MentionTextarea
                value={editText}
                onChange={setEditText}
                members={members}
                placeholder={t("taskDetailSheet.editCommentPlaceholder") || "Şərhi redaktə edin..."}
                rows={2}
                autoFocus
                onSubmit={() => saveEdit(comment)}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveEdit(comment)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("taskDetailSheet.save") || "Yadda saxla"}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs font-medium text-muted-foreground hover:underline"
                >
                  {t("taskDetailSheet.cancel") || "Ləğv et"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {renderMentionedContent(comment.content, comment.mentionedUserIds, members)}
            </p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-3 mt-1.5">
              {depth === 0 && (
                <button
                  onClick={() => { setReplyingTo(isReplying ? null : comment.id); setReplyText(""); }}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <Reply className="w-3 h-3" /> {t("taskDetailSheet.reply") || "Cavab yaz"}
                </button>
              )}
              {isOwn && (
                <button
                  onClick={() => { setEditingId(comment.id); setEditText(comment.content); }}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <Pencil className="w-3 h-3" /> {t("taskDetailSheet.edit") || "Redaktə et"}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => deleteComment(comment)}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> {t("taskDetailSheet.deleteBtn") || "Sil"}
                </button>
              )}
            </div>
          )}

          {isReplying && (
            <div className="flex items-end gap-2 mt-3">
              <MentionTextarea
                value={replyText}
                onChange={setReplyText}
                members={members}
                placeholder={t("taskDetailSheet.replyPlaceholder") || "Cavab yazın..."}
                rows={1}
                autoFocus
                onSubmit={() =>
                  submitComment(replyText, comment.id, () => {
                    setReplyText("");
                    setReplyingTo(null);
                  })
                }
              />
              <button
                disabled={!replyText.trim() || submitting}
                onClick={() =>
                  submitComment(replyText, comment.id, () => {
                    setReplyText("");
                    setReplyingTo(null);
                  })
                }
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {depth === 0 &&
            repliesOf(comment.id).map((reply) => renderComment(reply, depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {topLevel.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t("taskDetailSheet.noComments") || "Hələ heç bir şərh yoxdur"}</p>
          </div>
        ) : (
          topLevel.map((comment) => renderComment(comment, 0))
        )}
      </div>

      {/* New comment input */}
      <div className="flex-shrink-0 border-t border-border p-4 bg-muted/30">
        <div className="flex items-end gap-2">
          <MentionTextarea
            value={newComment}
            onChange={setNewComment}
            members={members}
            placeholder={t("taskDetailSheet.commentPlaceholder") || "Şərh yazın... (@ ilə kimisə qeyd edin)"}
            rows={2}
            onSubmit={() => submitComment(newComment, null, () => setNewComment(""))}
          />
          <button
            disabled={!newComment.trim() || submitting}
            onClick={() => submitComment(newComment, null, () => setNewComment(""))}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Files
// ═══════════════════════════════════════════════════════════════════════════
interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  uploadedById: string;
  uploadedBy: { id: string; name: string; avatar?: string | null };
}

function FilesTab({
  taskId,
  onCountChange,
  t,
}: {
  taskId: string;
  onCountChange: (count: number) => void;
  t: any;
}) {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const currentUserId: string | undefined = currentUser?.id;
  const canDeleteAny: boolean = (currentUser?.role?.permissions ?? []).includes("CAN_DELETE_ANY_FILE");

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
        onCountChange(data.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUploadComplete = async (res: any[]) => {
    if (!res?.length) return;
    for (const file of res) {
      try {
        const response = await fetch(`/api/tasks/${taskId}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: file.url ?? file.ufsUrl,
            fileKey: file.key,
            fileType: file.type,
            fileSize: file.size,
          }),
        });
        if (response.ok) {
          const created = await response.json();
          setAttachments((prev) => {
            const next = [created, ...prev];
            onCountChange(next.length);
            return next;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteAttachment = async (att: AttachmentItem) => {
    if (!confirm(t("taskDetailSheet.confirmDeleteFile") || "Bu faylı silmək istədiyinizə əminsiniz?")) return;
    const snapshot = attachments;
    setAttachments((prev) => {
      const next = prev.filter((a) => a.id !== att.id);
      onCountChange(next.length);
      return next;
    });
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments/${att.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
    } catch (e) {
      console.error(e);
      setAttachments(snapshot);
      onCountChange(snapshot.length);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {(t("taskDetailSheet.filesTitle") || "Fayllar ({count})").replace("{count}", String(attachments.length))}
        </h3>
        <UploadButton
          endpoint="taskAttachment"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={(e: Error) => setError(e.message)}
          appearance={{
            button:
              "text-xs px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 focus-within:ring-0 after:bg-transparent text-primary-foreground font-medium",
            allowedContent: "hidden",
          }}
          content={{ button: t("taskDetailSheet.addFileBtn") || "Fayl əlavə et" }}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">⚠️ {error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t("taskDetailSheet.noFiles") || "Hələ heç bir fayl əlavə olunmayıb"}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((att) => {
            const canDelete = att.uploadedById === currentUserId || canDeleteAny;
            const isImage = att.fileType.startsWith("image/");
            return (
              <div
                key={att.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {isImage ? (
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{att.fileName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {att.uploadedBy?.name} · {formatFileSize(att.fileSize)} · {timeAgo(new Date(att.createdAt))}
                  </p>
                </div>
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
                  title={t("taskDetailSheet.download") || "Yüklə"}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                {canDelete && (
                  <button
                    onClick={() => deleteAttachment(att)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                    title={t("taskDetailSheet.deleteBtn") || "Sil"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Time Logs
// ═══════════════════════════════════════════════════════════════════════════
function TimeTab({ estimatedHours, t }: { estimatedHours: number | null; t: any }) {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-muted rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("taskDetailSheet.timeSummary") || "Vaxt Xülasəsi"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{estimatedHours ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("taskDetailSheet.estHours") || "Təxmini saat"}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground mt-1">{t("taskDetailSheet.spentHours") || "Sərf olunan saat"}</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">{t("taskDetailSheet.timeModuleSoon") || "Vaxt qeydiyyatı modulu tezliklə əlavə olunacaq"}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared: Property Field
// ═══════════════════════════════════════════════════════════════════════════
function PropertyField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
