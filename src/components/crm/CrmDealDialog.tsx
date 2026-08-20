"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CrmCompanySelect } from "./CrmCompanySelect";
import { toDateInputValue } from "./crmUtils";
import type { CrmStage, CrmDeal, CrmContact, CrmCompanyLite, CrmMember } from "./types";

const CURRENCIES = ["AZN", "USD", "EUR"];

interface CrmDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  deal?: CrmDeal | null;
  defaultStageId?: string;
  stages: CrmStage[];
  members: CrmMember[];
  contacts: CrmContact[];
  companies: CrmCompanyLite[];
  onCreated: (deal: CrmDeal) => void;
  onUpdated: (deal: CrmDeal) => void;
  onDeleted: (dealId: string) => void;
  onCompanyCreated: (company: CrmCompanyLite) => void;
}

function emptyForm(defaultStageId?: string) {
  return {
    title: "",
    value: "",
    currency: "AZN",
    expectedCloseDate: "",
    deadline: "",
    clientName: "",
    clientCompany: "",
    clientPhone: "",
    clientEmail: "",
    stageId: defaultStageId || "",
    assigneeId: "",
    crmContactId: "",
    crmCompanyId: "",
    status: "OPEN",
  };
}

const selectClass =
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

// =============================================================================
// CrmDealDialog — Əqd yaratma / redaktə forması (Kanban və Cədvəl görünüşləri
// üçün paylaşılan komponent). PATCH /api/crm/deals/[id] artıq bütün bu sahələri
// qəbul edir (stageId, title, value, currency, expectedCloseDate,
// deadline, clientName, clientCompany, clientPhone, clientEmail, status,
// assigneeId, crmContactId, crmCompanyId).
// =============================================================================
export function CrmDealDialog({
  open,
  onOpenChange,
  mode,
  deal,
  defaultStageId,
  stages,
  members,
  contacts,
  companies,
  onCreated,
  onUpdated,
  onDeleted,
  onCompanyCreated,
}: CrmDealDialogProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const STATUS_OPTIONS = [
    { value: "OPEN", label: t("crmDealDialog.statusOpen") || "Açıq" },
    { value: "WON", label: t("crmDealDialog.statusWon") || "Qazanıldı" },
    { value: "LOST", label: t("crmDealDialog.statusLost") || "İtirildi" },
  ];

  const [form, setForm] = useState(emptyForm(defaultStageId));
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && deal) {
      setForm({
        title: deal.title,
        value: deal.value != null ? String(deal.value) : "",
        currency: deal.currency || "AZN",
        expectedCloseDate: toDateInputValue(deal.expectedCloseDate),
        deadline: toDateInputValue(deal.deadline),
        clientName: deal.clientName || "",
        clientCompany: deal.clientCompany || "",
        clientPhone: deal.clientPhone || "",
        clientEmail: deal.clientEmail || "",
        stageId: deal.stageId,
        assigneeId: deal.assigneeId || "",
        crmContactId: deal.crmContactId || "",
        crmCompanyId: deal.crmCompanyId || "",
        status: deal.status || "OPEN",
      });
    } else {
      setForm(emptyForm(defaultStageId));
    }
  }, [open, mode, deal, defaultStageId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("crmDealDialog.errorTitleRequired") || "Əqdin adı mütləqdir");
      return;
    }
    if (!form.stageId) {
      toast.error(t("crmDealDialog.errorStageRequired") || "Mərhələ seçilməlidir");
      return;
    }

    setLoading(true);
    const payload: Record<string, unknown> = {
      title: form.title,
      value: form.value,
      currency: form.currency,
      expectedCloseDate: form.expectedCloseDate || null,
      deadline: form.deadline || null,
      clientName: form.clientName || null,
      clientCompany: form.clientCompany || null,
      clientPhone: form.clientPhone || null,
      clientEmail: form.clientEmail || null,
      stageId: form.stageId,
      assigneeId: form.assigneeId || null,
      crmContactId: form.crmContactId || null,
      crmCompanyId: form.crmCompanyId || null,
    };
    if (mode === "edit") payload.status = form.status;

    try {
      const url = mode === "create" ? "/api/crm/deals" : `/api/crm/deals/${deal!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || (t("crmDealDialog.errorGeneric") || "Xəta baş verdi"));
      const data = await res.json();
      if (mode === "create") {
        onCreated(data);
        toast.success(t("crmDealDialog.successCreated") || "Əqd yaradıldı");
      } else {
        onUpdated(data);
        toast.success(t("crmDealDialog.successUpdated") || "Əqd yeniləndi");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || (t("crmDealDialog.errorGeneric") || "Xəta baş verdi"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deal) return;
    const confirmMessage = (t("crmDealDialog.confirmDelete") || `"${deal.title}" əqdini silmək istədiyinizə əminsiniz?`).replace("{name}", deal.title);
    if (!confirm(confirmMessage)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("crmDealDialog.errorGeneric") || "Xəta baş verdi");
      onDeleted(deal.id);
      toast.success(t("crmDealDialog.successDeleted") || "Əqd silindi");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || (t("crmDealDialog.errorDelete") || "Əqd silinərkən xəta baş verdi"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? (t("crmDealDialog.titleCreate") || "Yeni Əqd Yarat")
              : (t("crmDealDialog.titleEdit") || "Əqdi Redaktə Et")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("crmDealDialog.dealTitle") || "Əqdin adı"}</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder={t("crmDealDialog.dealTitlePlaceholder") || "Məs: Saytın yığılması..."}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.value") || "Məbləğ"}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.currency") || "Valyuta"}</Label>
            <select
              value={form.currency}
              onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
              className={selectClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("crmDealDialog.stage") || "Mərhələ"}</Label>
            <select
              value={form.stageId}
              onChange={(e) => setForm((p) => ({ ...p, stageId: e.target.value }))}
              className={selectClass}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.deadline") || "Deadline"}</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.closeDate") || "Bağlanma Tarixi"}</Label>
            <Input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm((p) => ({ ...p, expectedCloseDate: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.clientName") || "Müştəri Adı"}</Label>
            <Input
              value={form.clientName}
              onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
              placeholder={t("crmDealDialog.clientNamePlaceholder") || "Məs: Əli Məmmədov"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.clientCompany") || "Şirkət adı"}</Label>
            <Input
              value={form.clientCompany}
              onChange={(e) => setForm((p) => ({ ...p, clientCompany: e.target.value }))}
              placeholder={t("crmDealDialog.clientCompanyPlaceholder") || "Məs: ABC MMC"}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.clientPhone") || "Telefon Nömrəsi"}</Label>
            <Input
              type="tel"
              value={form.clientPhone}
              onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))}
              placeholder={t("crmDealDialog.clientPhonePlaceholder") || "+994 50 000 00 00"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.clientEmail") || "Email"}</Label>
            <Input
              type="email"
              value={form.clientEmail}
              onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))}
              placeholder={t("crmDealDialog.clientEmailPlaceholder") || "name@company.com"}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.assignee") || "İcraçı"}</Label>
            <select
              value={form.assigneeId}
              onChange={(e) => setForm((p) => ({ ...p, assigneeId: e.target.value }))}
              className={selectClass}
            >
              <option value="">{t("crmDealDialog.notSelected") || "Seçilməyib"}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("crmDealDialog.contactPerson") || "Əlaqədar Şəxs"}</Label>
            <select
              value={form.crmContactId}
              onChange={(e) => setForm((p) => ({ ...p, crmContactId: e.target.value }))}
              className={selectClass}
            >
              <option value="">{t("crmDealDialog.notSelected") || "Seçilməyib"}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName || ""}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("crmDealDialog.relatedCompany") || "Əlaqədar Şirkət"}</Label>
            <CrmCompanySelect
              value={form.crmCompanyId}
              onChange={(id) => setForm((p) => ({ ...p, crmCompanyId: id }))}
              companies={companies}
              onCompanyCreated={onCompanyCreated}
            />
          </div>

          {mode === "edit" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("crmDealDialog.status") || "Status"}</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className={selectClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 sm:col-span-2">
            {mode === "edit" ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" /> {deleting ? (t("crmDealDialog.deleting") || "Silinir...") : (t("crmDealDialog.delete") || "Sil")}
              </Button>
            ) : <span />}
            <Button type="submit" disabled={loading}>
              {loading
                ? (t("crmDealDialog.saving") || "Yadda saxlanılır...")
                : mode === "create"
                  ? (t("crmDealDialog.create") || "Yarat")
                  : (t("crmDealDialog.save") || "Yadda saxla")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
