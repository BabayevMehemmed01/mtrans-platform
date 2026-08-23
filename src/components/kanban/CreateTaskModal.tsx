"use client";

import { useEffect, useState } from "react";
import { BookmarkPlus, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { ObserverMultiSelect } from "./ObserverMultiSelect";
import type { KanbanTask, TaskMember } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  data?: { priority?: string; estimatedHours?: number | null } | null;
}

interface CreateTaskModalProps {
  projectId: string;
  defaultStatus: string;
  defaultDueDate?: string | null;
  members: TaskMember[];
  onCreated: (task: KanbanTask) => void;
  onClose: () => void;
}

export function CreateTaskModal({
  projectId,
  defaultStatus,
  defaultDueDate,
  members,
  onCreated,
  onClose,
}: CreateTaskModalProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [loading, setLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState("");
  const [templateNotice, setTemplateNotice] = useState("");
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: defaultStatus,
    assigneeId: "",
    observerIds: [] as string[],
    dueDate: defaultDueDate ?? "",
    estimatedHours: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/task-templates")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const applyTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find((x) => x.id === id);
    if (!tpl) return;
    // Şablonun `data`-sı KLONLANIR (JSON deep-copy) — bu formu doldurmaq üçün
    // istifadə olunur, Master TaskTemplate sətrinə heç bir referans qalmır.
    const cloned = tpl.data ? (JSON.parse(JSON.stringify(tpl.data)) as NonNullable<TaskTemplate["data"]>) : {};
    setForm((p) => ({
      ...p,
      title: tpl.name,
      description: tpl.description ?? "",
      priority: cloned.priority ?? p.priority,
      estimatedHours: cloned.estimatedHours != null ? String(cloned.estimatedHours) : p.estimatedHours,
    }));
  };

  const handleSaveAsTemplate = async () => {
    if (!form.title.trim()) {
      setError(t("createTaskModal.errorTitleRequired") || "Tapşırıq adı tələb olunur");
      return;
    }
    setSavingTemplate(true);
    setError("");
    setTemplateNotice("");
    try {
      const res = await fetch("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.title.trim(),
          description: form.description || null,
          data: {
            priority: form.priority,
            estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (t("createTaskModal.errorGeneric") || "Xəta baş verdi"));
        return;
      }
      setTemplates((prev) => [data, ...prev]);
      setSelectedTemplateId(data.id);
      setTemplateNotice(t("createTaskModal.templateSaved") || "Şablon yadda saxlanıldı");
    } catch {
      setError(t("createTaskModal.errorNetwork") || "Şəbəkə xətası");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError(t("createTaskModal.errorTitleRequired") || "Tapşırıq adı tələb olunur");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          projectId,
          assigneeId: form.assigneeId || null,
          observerIds: form.observerIds,
          dueDate: form.dueDate || null,
          estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (t("createTaskModal.errorGeneric") || "Xəta baş verdi"));
        return;
      }
      onCreated(data);
    } catch {
      setError(t("createTaskModal.errorNetwork") || "Şəbəkə xətası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[90vh] rounded-2xl bg-card border border-border shadow-2xl animate-scale-in overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">{t("createTaskModal.title") || "Yeni Tapşırıq"}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {error && (
              <p className="text-sm text-destructive bg-destructive/8 px-3 py-2 rounded-lg">
                ⚠️ {error}
              </p>
            )}
            {templateNotice && (
              <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">
                {templateNotice}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                {t("createTaskModal.templates") || "Şablonlar"}
              </label>
              <Select value={selectedTemplateId} onValueChange={(v) => v && applyTemplate(v)}>
                <SelectTrigger className="w-full bg-background border-border text-sm">
                  <SelectValue placeholder={t("createTaskModal.templatesPlaceholder") || "Şablon seçin (istəyə bağlı)"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                {t("createTaskModal.taskName") || "Tapşırıq Adı"} <span className="text-destructive">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                autoFocus
                placeholder={t("createTaskModal.taskNamePlaceholder") || "Məsələn: Login formu dizaynı"}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">{t("createTaskModal.description") || "Təsvir"}</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder={t("createTaskModal.descriptionPlaceholder") || "Tapşırıq haqqında əlavə məlumat..."}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">{t("createTaskModal.priority") || "Prioritet"}</label>
                <Select value={form.priority} onValueChange={(v) => v && setForm((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger className="w-full bg-background border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">{t("createTaskModal.priorityLow") || "Aşağı"}</SelectItem>
                    <SelectItem value="MEDIUM">{t("createTaskModal.priorityMedium") || "Orta"}</SelectItem>
                    <SelectItem value="HIGH">{t("createTaskModal.priorityHigh") || "Yüksək"}</SelectItem>
                    <SelectItem value="URGENT">{t("createTaskModal.priorityUrgent") || "Təcili"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">{t("createTaskModal.assignee") || "İcraçı"}</label>
                <Select value={form.assigneeId || "__none__"} onValueChange={(v) => setForm((p) => ({ ...p, assigneeId: !v || v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="w-full bg-background border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("createTaskModal.notSelected") || "Seçilməyib"}</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                {t("createTaskModal.observers") || "Müşahidəçilər"}
              </label>
              <ObserverMultiSelect
                members={members}
                selectedIds={form.observerIds}
                excludeId={form.assigneeId || undefined}
                onChange={(ids) => setForm((p) => ({ ...p, observerIds: ids }))}
                placeholder={t("createTaskModal.observersPlaceholder") || "Müşahidəçi seçin"}
                searchPlaceholder={t("createTaskModal.observersSearch") || "Axtar..."}
                emptyText={t("createTaskModal.observersEmpty") || "Nəticə yoxdur"}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">{t("createTaskModal.dueDate") || "Son Tarix"}</label>
                <input
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">{t("createTaskModal.estimatedHours") || "Təxmini Vaxt (saat)"}</label>
                <input
                  name="estimatedHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={handleChange}
                  placeholder="Məs: 4"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate || loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors text-foreground"
              >
                {savingTemplate ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BookmarkPlus className="w-4 h-4" />
                )}
                {t("createTaskModal.saveAsTemplate") || "Şablon kimi yadda saxla"}
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors text-foreground"
                >
                  {t("createTaskModal.cancel") || "Ləğv Et"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-semibold transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("createTaskModal.creating") || "Yaradılır..."}
                    </>
                  ) : (
                    t("createTaskModal.create") || "Yarat"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
