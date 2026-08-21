"use client";

import { useEffect, useState } from "react";
import { BookmarkPlus, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { ObserverMultiSelect } from "./ObserverMultiSelect";
import type { KanbanTask, TaskMember, KanbanLabel } from "./types";

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
}

interface CreateTaskModalProps {
  projectId: string;
  defaultStatus: string;
  defaultDueDate?: string | null;
  members: TaskMember[];
  labels: KanbanLabel[];
  onCreated: (task: KanbanTask) => void;
  onClose: () => void;
}

export function CreateTaskModal({
  projectId,
  defaultStatus,
  defaultDueDate,
  members,
  labels,
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
    labelIds: [] as string[],
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const toggleLabel = (id: string) => {
    setForm((p) => ({
      ...p,
      labelIds: p.labelIds.includes(id)
        ? p.labelIds.filter((l) => l !== id)
        : [...p.labelIds, id],
    }));
  };

  const applyTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find((x) => x.id === id);
    if (!tpl) return;
    setForm((p) => ({
      ...p,
      title: tpl.name,
      description: tpl.description ?? "",
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
        <div className="w-full max-w-lg max-h-[90vh] rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-2xl animate-scale-in overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
            <h2 className="text-base font-semibold">{t("createTaskModal.title") || "Yeni Tapşırıq"}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {error && (
              <p className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.08)] px-3 py-2 rounded-lg">
                ⚠️ {error}
              </p>
            )}
            {templateNotice && (
              <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                {templateNotice}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("createTaskModal.templates") || "Şablonlar"}
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
              >
                <option value="">
                  {t("createTaskModal.templatesPlaceholder") || "Şablon seçin (istəyə bağlı)"}
                </option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("createTaskModal.taskName") || "Tapşırıq Adı"} <span className="text-[hsl(var(--destructive))]">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                autoFocus
                placeholder={t("createTaskModal.taskNamePlaceholder") || "Məsələn: Login formu dizaynı"}
                className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("createTaskModal.description") || "Təsvir"}</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder={t("createTaskModal.descriptionPlaceholder") || "Tapşırıq haqqında əlavə məlumat..."}
                className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("createTaskModal.priority") || "Prioritet"}</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
                >
                  <option value="LOW">{t("createTaskModal.priorityLow") || "Aşağı"}</option>
                  <option value="MEDIUM">{t("createTaskModal.priorityMedium") || "Orta"}</option>
                  <option value="HIGH">{t("createTaskModal.priorityHigh") || "Yüksək"}</option>
                  <option value="URGENT">{t("createTaskModal.priorityUrgent") || "Təcili"}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("createTaskModal.assignee") || "İcraçı"}</label>
                <select
                  name="assigneeId"
                  value={form.assigneeId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
                >
                  <option value="">{t("createTaskModal.notSelected") || "Seçilməyib"}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
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

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("createTaskModal.dueDate") || "Son Tarix"}</label>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
              />
            </div>

            {labels.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">{t("createTaskModal.labels") || "Etiketlər"}</label>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((label) => {
                    const selected = form.labelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => toggleLabel(label.id)}
                        className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                        style={{
                          backgroundColor: selected ? label.color : undefined,
                          color: selected ? "white" : label.color,
                          border: `1.5px solid ${label.color}`,
                          opacity: selected ? 1 : 0.7,
                        }}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate || loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--accent))] disabled:opacity-50 transition-colors"
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
                  className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  {t("createTaskModal.cancel") || "Ləğv Et"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
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
