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
import type { CrmCompanyLite } from "./types";

interface CrmCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  company?: CrmCompanyLite | null;
  onCreated: (company: CrmCompanyLite) => void;
  onUpdated: (company: CrmCompanyLite) => void;
  onDeleted: (companyId: string) => void;
}

function emptyForm() {
  return { name: "", industry: "", website: "", phone: "", email: "", address: "" };
}

export function CrmCompanyDialog({
  open,
  onOpenChange,
  mode,
  company,
  onCreated,
  onUpdated,
  onDeleted,
}: CrmCompanyDialogProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && company) {
      setForm({
        name: company.name,
        industry: company.industry || "",
        website: company.website || "",
        phone: company.phone || "",
        email: company.email || "",
        address: company.address || "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, mode, company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("crmCompanySelect.errorNameRequired") || "Şirkət adı mütləqdir");
      return;
    }
    setLoading(true);
    try {
      const url = mode === "create" ? "/api/crm/companies" : `/api/crm/companies/${company!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || (t("crmCompanySelect.errorGeneric") || "Xəta baş verdi"));
      const data = await res.json();
      if (mode === "create") {
        onCreated(data);
        toast.success(t("crmCompanySelect.successCreated") || "Şirkət yaradıldı");
      } else {
        onUpdated(data);
        toast.success(t("crmCompanies.successUpdated") || "Şirkət yeniləndi");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || (t("crmCompanySelect.errorGeneric") || "Xəta baş verdi"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!company) return;
    const confirmMessage = (t("crmCompanies.confirmDelete") || `"{name}" şirkətini silmək istədiyinizə əminsiniz?`).replace("{name}", company.name);
    if (!confirm(confirmMessage)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/companies/${company.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || (t("crmCompanySelect.errorGeneric") || "Xəta baş verdi"));
      onDeleted(company.id);
      toast.success(t("crmCompanies.successDeleted") || "Şirkət silindi");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || (t("crmCompanySelect.errorGeneric") || "Xəta baş verdi"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? (t("crmCompanySelect.modalTitle") || "Yeni CRM Şirkəti")
              : (t("crmCompanies.editTitle") || "Şirkəti Redaktə Et")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>{t("crmCompanySelect.companyName") || "Şirkətin adı"} *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("crmCompanySelect.companyNamePlaceholder") || "Məs: ABC MMC"}
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("crmCompanySelect.industry") || "Sahə"}</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                placeholder={t("crmCompanySelect.industryPlaceholder") || "Məs: Tikinti"}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("crmCompanySelect.website") || "Vebsayt"}</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("crmCompanySelect.phone") || "Telefon"}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+994 50 000 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("crmCompanySelect.email") || "Email"}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="info@company.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("crmCompanySelect.address") || "Ünvan"}</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {mode === "edit" ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" /> {deleting ? (t("crmCompanies.deleting") || "Silinir...") : (t("crmCompanies.delete") || "Sil")}
              </Button>
            ) : <span />}
            <Button type="submit" disabled={loading}>
              {loading ? (t("crmCompanySelect.creating") || "Yaradılır...") : (t("crmCompanies.save") || "Yadda saxla")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
