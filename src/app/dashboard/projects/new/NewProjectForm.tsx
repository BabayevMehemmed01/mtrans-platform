"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, Save } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planlanır" },
  { value: "ACTIVE", label: "Aktiv" },
  { value: "ON_HOLD", label: "Dayandırılıb" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Aşağı" },
  { value: "MEDIUM", label: "Orta" },
  { value: "HIGH", label: "Yüksək" },
  { value: "URGENT", label: "Təcili" },
];

const COLOR_PRESETS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#14b8a6",
];

type DepartmentOption = {
  id: string;
  name: string;
  color: string;
};

interface NewProjectFormProps {
  departments: DepartmentOption[];
  defaultDepartmentId?: string;
}

export function NewProjectForm({ departments, defaultDepartmentId }: NewProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departmentError, setDepartmentError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    color: "#6366f1",
    startDate: "",
    endDate: "",
    departmentId: defaultDepartmentId ?? "",
  });

  const hasDepartments = departments.length > 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (e.target.name === "departmentId") setDepartmentError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Layihə adı tələb olunur"); return; }
    if (!form.departmentId) { setDepartmentError("Şöbə seçilməlidir"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xəta baş verdi"); return; }
      router.push(`/dashboard/projects/${data.id}?tab=tasks`); // Yaradan kimi Tasklar tabına atsın
    } catch {
      setError("Şəbəkə xətası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative pb-24 space-y-5">
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5 shadow-sm">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.2)] text-[hsl(var(--destructive))] text-sm">
            ⚠️ {error}
          </div>
        )}

        {!hasDepartments && (
          <div className="px-4 py-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.2)] text-sm space-y-1">
            <p className="text-[hsl(var(--destructive))] font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Əvvəlcə bir şöbə yaradın
            </p>
            <p className="text-[hsl(var(--muted-foreground))]">
              Layihə yaratmaq üçün şirkətinizdə ən az bir şöbə olmalıdır.{" "}
              <Link href="/dashboard/departments" className="text-[hsl(var(--primary))] font-medium hover:underline">
                Şöbələr səhifəsinə keçin
              </Link>
            </p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Layihə Adı <span className="text-[hsl(var(--destructive))]">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Məsələn: CRM Sistemi v2.0"
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
            rows={3}
            placeholder="Layihə haqqında qısa məlumat..."
            className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all resize-none"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Şöbə <span className="text-[hsl(var(--destructive))]">*</span>
          </label>
          <select
            name="departmentId"
            value={form.departmentId}
            onChange={handleChange}
            disabled={!hasDepartments}
            className={`w-full px-3 py-2.5 rounded-lg border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              departmentError ? "border-[hsl(var(--destructive))]" : "border-[hsl(var(--border))]"
            }`}
          >
            <option value="" disabled>
              {hasDepartments ? "Şöbə seçin" : "Şöbə mövcud deyil"}
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {departmentError && (
            <p className="mt-1.5 text-xs text-[hsl(var(--destructive))]">{departmentError}</p>
          )}
        </div>

        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Prioritet</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start + End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Başlama Tarixi</label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Bitmə Tarixi</label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)] transition-all"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium mb-2">Layihə Rəngi</label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, color }))}
                className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  outline: form.color === color ? `3px solid ${color}` : undefined,
                  outlineOffset: "2px",
                }}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                className="w-8 h-8 rounded-lg cursor-pointer border border-[hsl(var(--border))] p-0.5"
                title="Özəl rəng seçin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* STICKY ACTIONS FOOTER - Həmişə ekranda görünür */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-end gap-3">
          <Link
            href="/dashboard/projects"
            className="px-5 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
          >
            Ləğv Et
          </Link>
          <button
            type="submit"
            disabled={loading || !hasDepartments}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Yaradılır..." : "Yadda Saxla və Yarat"}
          </button>
        </div>
      </div>
    </form>
  );
}