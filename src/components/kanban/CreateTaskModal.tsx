"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { KanbanTask, TaskMember, KanbanLabel } from "./types";

interface CreateTaskModalProps {
  projectId: string;
  defaultStatus: string;
  members: TaskMember[];
  labels: KanbanLabel[];
  onCreated: (task: KanbanTask) => void;
  onClose: () => void;
}

export function CreateTaskModal({
  projectId,
  defaultStatus,
  members,
  labels,
  onCreated,
  onClose,
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: defaultStatus,
    assigneeId: "",
    dueDate: "",
    labelIds: [] as string[],
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Tapşırıq adı tələb olunur"); return; }
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
          dueDate: form.dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xəta baş verdi"); return; }
      onCreated(data);
    } catch {
      setError("Şəbəkə xətası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-2xl animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
            <h2 className="text-base font-semibold">Yeni Tapşırıq</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <p className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.08)] px-3 py-2 rounded-lg">
                ⚠️ {error}
              </p>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Tapşırıq Adı <span className="text-[hsl(var(--destructive))]">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                autoFocus
                placeholder="Məsələn: Login formu dizaynı"
                className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Təsvir</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Tapşırıq haqqında əlavə məlumat..."
                className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all resize-none"
              />
            </div>

            {/* Priority + Assignee */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Prioritet</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
                >
                  <option value="LOW">Aşağı</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksək</option>
                  <option value="URGENT">Təcili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">İcraçı</label>
                <select
                  name="assigneeId"
                  value={form.assigneeId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
                >
                  <option value="">Seçilməyib</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Son Tarix</label>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
              />
            </div>

            {/* Labels */}
            {labels.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Etiketlər</label>
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

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
              >
                Ləğv Et
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Yaradılır...</> : "Yarat"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
