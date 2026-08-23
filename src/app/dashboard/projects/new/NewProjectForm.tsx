"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n";  // YENİ
import { Loader2, Building2, Save, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectTemplate = {
  id: string;
  name: string;
  description: string | null;
  data: { status?: string; priority?: string; color?: string } | null;
};

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
  
  // YENİ: Dili oxuyuruq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  // Status və Priority üçün tərcümə obyektləri qururuq
  const STATUS_OPTIONS = [
    { value: "PLANNING", label: t("projectStatus.PLANNING") || "Planlanır" },
    { value: "ACTIVE", label: t("projectStatus.ACTIVE") || "Aktiv" },
    { value: "ON_HOLD", label: t("projectStatus.ON_HOLD") || "Dayandırılıb" },
  ];

  const PRIORITY_OPTIONS = [
    { value: "LOW", label: t("priority.LOW") || "Aşağı" },
    { value: "MEDIUM", label: t("priority.MEDIUM") || "Orta" },
    { value: "HIGH", label: t("priority.HIGH") || "Yüksək" },
    { value: "URGENT", label: t("priority.URGENT") || "Təcili" },
  ];

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

  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/templates?type=PROJECT")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = templates.find((tp) => tp.id === id);
    if (!tpl?.data) return;
    // Şablonun `data` sahəsi klonlanır — bu, əsas (master) şablonu
    // heç bir şəkildə dəyişdirmədən yeni layihəyə başlanğıc dəyərlər verir.
    const cloned = JSON.parse(JSON.stringify(tpl.data)) as ProjectTemplate["data"];
    setForm((prev) => ({
      ...prev,
      status: cloned?.status ?? prev.status,
      priority: cloned?.priority ?? prev.priority,
      color: cloned?.color ?? prev.color,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (e.target.name === "departmentId") setDepartmentError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(t("newProject.errorNameRequired") || "Layihə adı tələb olunur"); return; }
    if (!form.departmentId) { setDepartmentError(t("newProject.errorDepartmentRequired") || "Şöbə seçilməlidir"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? (t("newProject.errorGeneric") || "Xəta baş verdi")); return; }
      router.push(`/dashboard/projects/${data.id}?tab=tasks`); // Yaradan kimi Tasklar tabına atsın
    } catch {
      setError(t("newProject.errorNetwork") || "Şəbəkə xətası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative pb-24 space-y-5">
      <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            ⚠️ {error}
          </div>
        )}

        {!hasDepartments && (
          <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm space-y-1">
            <p className="text-destructive font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {t("newProject.noDepartmentTitle") || "Əvvəlcə bir şöbə yaradın"}
            </p>
            <p className="text-muted-foreground">
              {t("newProject.noDepartmentDesc") || "Layihə yaratmaq üçün şirkətinizdə ən az bir şöbə olmalıdır."}{" "}
              <Link href="/dashboard/departments" className="text-primary font-medium hover:underline">
                {t("newProject.goToDepartments") || "Şöbələr səhifəsinə keçin"}
              </Link>
            </p>
          </div>
        )}

        {/* Şablon seçimi */}
        {templates.length > 0 && (
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground" />
              {t("newProject.templateLabel") || "Şablondan başla (istəyə bağlı)"}
            </label>
            <Select value={templateId || undefined} onValueChange={(v) => applyTemplate(v ?? "")}>
              <SelectTrigger className="w-full h-[42px] rounded-lg bg-background">
                <SelectValue placeholder={t("newProject.selectTemplate") || "Boş başlayın və ya şablon seçin"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templateId && templates.find((tp) => tp.id === templateId)?.description && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {templates.find((tp) => tp.id === templateId)?.description}
              </p>
            )}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t("newProject.nameLabel") || "Layihə Adı"} <span className="text-destructive">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t("newProject.namePlaceholder") || "Məsələn: CRM Sistemi v2.0"}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t("newProject.descLabel") || "Təsvir"}
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder={t("newProject.descPlaceholder") || "Layihə haqqında qısa məlumat..."}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t("newProject.departmentLabel") || "Şöbə"} <span className="text-destructive">*</span>
          </label>
          <Select
            value={form.departmentId || undefined}
            onValueChange={(v) => {
              setDepartmentError("");
              setForm((prev) => ({ ...prev, departmentId: v ?? "" }));
            }}
            disabled={!hasDepartments}
          >
            <SelectTrigger className={`w-full h-[42px] rounded-lg bg-background ${departmentError ? "border-destructive" : "border-border"}`}>
              <SelectValue
                placeholder={
                  hasDepartments
                    ? (t("newProject.selectDepartment") || "Şöbə seçin")
                    : (t("newProject.noDepartmentAvailable") || "Şöbə mövcud deyil")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {departmentError && (
            <p className="mt-1.5 text-xs text-destructive">{departmentError}</p>
          )}
        </div>

        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("newProject.statusLabel") || "Status"}
            </label>
            <Select
              value={form.status}
              onValueChange={(v) => v && setForm((prev) => ({ ...prev, status: v }))}
            >
              <SelectTrigger className="w-full h-[42px] rounded-lg bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("newProject.priorityLabel") || "Prioritet"}
            </label>
            <Select
              value={form.priority}
              onValueChange={(v) => v && setForm((prev) => ({ ...prev, priority: v }))}
            >
              <SelectTrigger className="w-full h-[42px] rounded-lg bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Start + End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("newProject.startDateLabel") || "Başlama Tarixi"}
            </label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("newProject.endDateLabel") || "Bitmə Tarixi"}
            </label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("newProject.colorLabel") || "Layihə Rəngi"}
          </label>
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
                className="w-8 h-8 rounded-lg cursor-pointer border border-border p-0.5"
                title={t("newProject.customColor") || "Özəl rəng seçin"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STICKY ACTIONS FOOTER - Həmişə ekranda görünür */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 bg-background border-t border-border p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-end gap-3">
          <Link
            href="/dashboard/projects"
            className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            {t("newProject.cancel") || "Ləğv Et"}
          </Link>
          <button
            type="submit"
            disabled={loading || !hasDepartments}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-semibold transition-colors shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? (t("newProject.saving") || "Yaradılır...") : (t("newProject.save") || "Yadda Saxla və Yarat")}
          </button>
        </div>
      </div>
    </form>
  );
}