"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // YENİ: Sessiyadan dil üçün
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki
import { toast } from "react-hot-toast";
import { Archive, ArchiveRestore, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  color: string;
  departmentId: string | null;
  isArchived: boolean;
};

export function ProjectSettingsClient({
  project,
  departments,
  canManage,
  canDelete,
}: {
  project: Project;
  departments: { id: string; name: string }[];
  canManage: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  // YENİ: Dili oxuyub tərcümə obyektini (t) qururuq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status);
  const [priority, setPriority] = useState(project.priority);
  const [color, setColor] = useState(project.color);
  const [departmentId, setDepartmentId] = useState(project.departmentId ?? "");
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? (t("projectSettingsClient.errorGeneric") || "Xəta baş verdi"));
    return res.json();
  };

  const save = async () => {
    setSaving(true);
    try {
      await patch({ name, description, status, priority, color, departmentId: departmentId || null });
      toast.success(t("projectSettingsClient.successUpdated") || "Layihə yeniləndi");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || (t("projectSettingsClient.errorGeneric") || "Xəta baş verdi"));
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async () => {
    setArchiving(true);
    try {
      await patch({ isArchived: !project.isArchived });
      toast.success(
        project.isArchived 
          ? (t("projectSettingsClient.successUnarchived") || "Layihə arxivdən çıxarıldı")
          : (t("projectSettingsClient.successArchived") || "Layihə arxivləşdirildi")
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || (t("projectSettingsClient.errorGeneric") || "Xəta baş verdi"));
    } finally {
      setArchiving(false);
    }
  };

  const deleteProject = async () => {
    const confirmMessage = t("projectSettingsClient.confirmDelete") || "Bu layihəni həmişəlik silmək istədiyinizə əminsiniz? Bütün tapşırıqlar da silinəcək.";
    if (!confirm(confirmMessage)) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? (t("projectSettingsClient.errorGeneric") || "Xəta baş verdi"));
      toast.success(t("projectSettingsClient.successDeleted") || "Layihə silindi");
      router.push("/dashboard/projects");
    } catch (err: any) {
      toast.error(err.message || (t("projectSettingsClient.errorGeneric") || "Xəta baş verdi"));
      setDeleting(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-[hsl(var(--primary))]" />
          {t("projectSettingsClient.generalInfo") || "Ümumi Məlumatlar"}
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("projectSettingsClient.projectName") || "Layihə Adı"}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} />
          </div>
          <div className="space-y-2">
            <Label>{t("projectSettingsClient.description") || "Təsvir"}</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage}
              rows={3}
              className="flex w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("projectSettingsClient.status") || "Status"}</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canManage}
                className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
              >
                <option value="PLANNING">{t("projectStatus.PLANNING") || "Planlanır"}</option>
                <option value="ACTIVE">{t("projectStatus.ACTIVE") || "Aktiv"}</option>
                <option value="ON_HOLD">{t("projectStatus.ON_HOLD") || "Dayandırılıb"}</option>
                <option value="COMPLETED">{t("projectStatus.COMPLETED") || "Tamamlandı"}</option>
                <option value="CANCELLED">{t("projectStatus.CANCELLED") || "Ləğv edildi"}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("projectSettingsClient.priority") || "Prioritet"}</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={!canManage}
                className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
              >
                <option value="LOW">{t("priority.LOW") || "Aşağı"}</option>
                <option value="MEDIUM">{t("priority.MEDIUM") || "Orta"}</option>
                <option value="HIGH">{t("priority.HIGH") || "Yüksək"}</option>
                <option value="URGENT">{t("priority.URGENT") || "Təcili"}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("projectSettingsClient.department") || "Şöbə"}</Label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={!canManage}
                className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
              >
                <option value="">{t("projectSettingsClient.noDepartment") || "— Şöbə seçilməyib —"}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("projectSettingsClient.color") || "Rəng"}</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={!canManage} className="h-10 w-full" />
            </div>
          </div>
          {canManage && (
            <div className="pt-2 flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving 
                  ? (t("projectSettingsClient.saving") || "Yadda saxlanılır...") 
                  : (t("projectSettingsClient.save") || "Dəyişiklikləri Yadda Saxla")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {canManage && (
        <div className="border border-amber-200 rounded-xl bg-amber-50/50 p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-amber-800">
            {project.isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
            {project.isArchived 
              ? (t("projectSettingsClient.unarchive") || "Arxivdən Çıxar") 
              : (t("projectSettingsClient.archive") || "Arxivləşdir")}
          </h3>
          <p className="text-sm text-amber-700 mb-4">
            {project.isArchived
              ? (t("projectSettingsClient.isArchivedDesc") || "Bu layihə hazırda arxivdədir. Aktiv layihələr siyahısında görünmür.")
              : (t("projectSettingsClient.isNotArchivedDesc") || "Arxivləşdirilmiş layihələr aktiv siyahıdan gizlədilir, lakin məlumatlar saxlanılır.")}
          </p>
          <Button variant="outline" onClick={toggleArchive} disabled={archiving}>
            {archiving 
              ? (t("projectSettingsClient.processing") || "İcra olunur...") 
              : project.isArchived 
                ? (t("projectSettingsClient.unarchive") || "Arxivdən Çıxar") 
                : (t("projectSettingsClient.archive") || "Arxivləşdir")}
          </Button>
        </div>
      )}

      {canDelete && (
        <div className="border border-red-200 rounded-xl bg-red-50/50 p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            {t("projectSettingsClient.deleteTitle") || "Layihəni Sil"}
          </h3>
          <p className="text-sm text-red-600 mb-4">
            {t("projectSettingsClient.deleteDesc") || "Bu əməliyyat geri qaytarıla bilməz. Layihə və ona aid bütün tapşırıqlar həmişəlik silinəcək."}
          </p>
          <Button variant="destructive" onClick={deleteProject} disabled={deleting}>
            {deleting 
              ? (t("projectSettingsClient.deleting") || "Silinir...") 
              : (t("projectSettingsClient.deleteBtn") || "Layihəni Həmişəlik Sil")}
          </Button>
        </div>
      )}
    </div>
  );
}