"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ

const COLOR_PRESETS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#14b8a6",
];

export function NewCollabForm() {
  const router = useRouter();
  
  // YENİ: Tərcümə mühərriki
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

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
  
  // DİQQƏT: departmentId buradan silindi ki, null getməsin
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    color: "#8b5cf6",
    startDate: "",
    endDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(t("newCollab.errorName") || "Layihə adı tələb olunur"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), // departmentId artıq göndərilmir, backend avtomatik null qəbul edəcək
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? (t("newCollab.errorGeneric") || "Xəta baş verdi")); return; }
      
      router.push(`/dashboard/projects/${data.id}?tab=tasks`);
    } catch {
      setError(t("newCollab.errorNetwork") || "Şəbəkə xətası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative pb-24 space-y-5">
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 space-y-5 shadow-sm">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 font-medium text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
            {t("newCollab.nameLabel") || "Layihə Adı"} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t("newCollab.namePlaceholder") || "Məsələn: Qlobal Marketinq və Satış İnteqrasiyası"}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
            {t("newCollab.descLabel") || "Məqsəd və Təsvir"}
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder={t("newCollab.descPlaceholder") || "Bu ortaq layihənin məqsədi nədir?..."}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
          />
        </div>

        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">{t("newCollab.statusLabel") || "Status"}</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">{t("newCollab.priorityLabel") || "Prioritet"}</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
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
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">{t("newCollab.startDate") || "Başlama Tarixi"}</label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">{t("newCollab.endDate") || "Bitmə Tarixi"}</label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-2">{t("newCollab.colorLabel") || "Layihə İkon Rəngi"}</label>
          <div className="flex items-center gap-3 flex-wrap bg-slate-50 p-3 rounded-xl border border-gray-200">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, color }))}
                className="w-8 h-8 rounded-lg shadow-sm transition-transform hover:scale-110"
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
                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300 shadow-sm p-0.5"
                title={t("newCollab.customColor") || "Özəl rəng seçin"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STICKY ACTIONS FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-end gap-3">
          <Link
            href="/dashboard/collab"
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-600 hover:bg-gray-50 transition-colors"
          >
            {t("newCollab.cancel") || "Ləğv Et"}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold transition-colors shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? (t("newCollab.saving") || "Yaradılır...") : (t("newCollab.save") || "Yadda Saxla və Yarat")}
          </button>
        </div>
      </div>
    </form>
  );
}