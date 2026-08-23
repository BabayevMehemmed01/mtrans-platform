"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CrmStage } from "./types";

const STAGE_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4", "#ec4899", "#64748b"];

interface CrmStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (stage: CrmStage) => void;
  mode?: "create" | "edit";
  stage?: CrmStage | null;
  allStages?: CrmStage[];
  onUpdated?: (stage: CrmStage) => void;
  onDeleted?: (stageId: string, reassignToStageId: string | null) => void;
}

export function CrmStageDialog({
  open,
  onOpenChange,
  onCreated,
  mode = "create",
  stage,
  allStages = [],
  onUpdated,
  onDeleted,
}: CrmStageDialogProps) {
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [name, setName] = useState("");
  const [color, setColor] = useState(STAGE_COLORS[0]);
  const [loading, setLoading] = useState(false);

  // Silmə axını: server "409 + dealCount" qaytarsa, istifadəçidən əqdlərin
  // köçürüləcəyi hədəf mərhələni seçməsi tələb olunur.
  const [deleting, setDeleting] = useState(false);
  const [dealCount, setDealCount] = useState<number | null>(null);
  const [reassignToStageId, setReassignToStageId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && stage) {
      setName(stage.name);
      setColor(stage.color || STAGE_COLORS[0]);
    } else {
      setName("");
      setColor(STAGE_COLORS[0]);
    }
    setDealCount(null);
    setReassignToStageId("");
  }, [open, mode, stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("crmStageDialog.errorNameRequired") || "Mərhələ adı mütləqdir");
      return;
    }
    setLoading(true);
    try {
      const url = mode === "edit" && stage ? `/api/crm/stages/${stage.id}` : "/api/crm/stages";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error((await res.json()).error || (t("crmStageDialog.errorGeneric") || "Xəta baş verdi"));
      const savedStage = await res.json();
      if (mode === "edit") {
        onUpdated?.(savedStage);
        toast.success(t("crmStageDialog.successUpdated") || "Mərhələ yeniləndi");
      } else {
        onCreated(savedStage);
        toast.success(t("crmStageDialog.successCreated") || "Mərhələ yaradıldı");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || (t("crmStageDialog.errorGeneric") || "Xəta baş verdi"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (withReassign?: string) => {
    if (!stage) return;
    if (!withReassign && !confirm(t("crmStageDialog.confirmDelete") || `"${stage.name}" mərhələsini silmək istədiyinizə əminsiniz?`)) {
      return;
    }
    setDeleting(true);
    try {
      const url = `/api/crm/stages/${stage.id}${withReassign ? `?reassignToStageId=${withReassign}` : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && typeof data.dealCount === "number") {
          setDealCount(data.dealCount);
          return;
        }
        throw new Error(data.error || (t("crmStageDialog.errorGeneric") || "Xəta baş verdi"));
      }
      onDeleted?.(stage.id, withReassign || null);
      toast.success(t("crmStageDialog.successDeleted") || "Mərhələ silindi");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || (t("crmStageDialog.errorGeneric") || "Xəta baş verdi"));
    } finally {
      setDeleting(false);
    }
  };

  const reassignTargets = allStages.filter((s) => s.id !== stage?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? (t("crmStageDialog.titleEdit") || "Mərhələni Redaktə Et")
              : (t("crmStageDialog.title") || "Yeni Mərhələ")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("crmStageDialog.stageNameLabel") || "Mərhələnin adı"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("crmStageDialog.stageNamePlaceholder") || "Məs: Təklif göndərildi"}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t("crmStageDialog.colorLabel") || "Rəng"}</Label>
            <div className="grid grid-cols-8 gap-2">
              {STAGE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{ backgroundColor: c, borderColor: color === c ? "currentColor" : "transparent" }}
                >
                  {color === c && <span className="w-2 h-2 bg-white rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {mode === "edit" && dealCount !== null && (
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive">
                {(t("crmStageDialog.hasDealsWarning") || "Bu mərhələdə {count} əqd var. Silmək üçün əvvəlcə əqdləri başqa mərhələyə köçürün.").replace("{count}", String(dealCount))}
              </p>
              <select
                value={reassignToStageId}
                onChange={(e) => setReassignToStageId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm"
              >
                <option value="">{t("crmStageDialog.selectTargetStage") || "Hədəf mərhələ seçin..."}</option>
                {reassignTargets.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={!reassignToStageId || deleting}
                onClick={() => handleDelete(reassignToStageId)}
              >
                {deleting
                  ? (t("crmStageDialog.deleting") || "Silinir...")
                  : (t("crmStageDialog.moveAndDelete") || "Köçür və Sil")}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete()}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" /> {t("crmStageDialog.delete") || "Mərhələni sil"}
              </Button>
            ) : <span />}
            <Button type="submit" disabled={loading}>
              {loading
                ? (t("crmStageDialog.creating") || "Yaradılır...")
                : mode === "edit"
                  ? (t("crmStageDialog.save") || "Yadda saxla")
                  : (t("crmStageDialog.create") || "Yarat")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
