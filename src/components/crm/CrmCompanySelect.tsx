"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CrmCompanyLite } from "./types";

interface CrmCompanySelectProps {
  value: string;
  onChange: (id: string) => void;
  companies: CrmCompanyLite[];
  onCompanyCreated: (company: CrmCompanyLite) => void;
}

function emptyCompanyForm() {
  return { name: "", industry: "", website: "", phone: "", email: "", address: "" };
}

export function CrmCompanySelect({ value, onChange, companies, onCompanyCreated }: CrmCompanySelectProps) {
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyCompanyForm());
  const [loading, setLoading] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__create__") {
      setIsCreateOpen(true);
      return;
    }
    onChange(e.target.value);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error(t("crmCompanySelect.errorNameRequired") || "Şirkət adı mütləqdir");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/crm/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || (t("crmCompanySelect.errorGeneric") || "Xəta baş verdi"));
      const company = await res.json();
      onCompanyCreated(company);
      onChange(company.id);
      toast.success(t("crmCompanySelect.successCreated") || "Şirkət yaradıldı");
      setIsCreateOpen(false);
      setForm(emptyCompanyForm());
    } catch (err: any) {
      toast.error(err.message || (t("crmCompanySelect.errorGeneric") || "Xəta baş verdi"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <select
        value={value}
        onChange={handleSelectChange}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="">{t("crmCompanySelect.notSelected") || "Seçilməyib"}</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        <option value="__create__">{t("crmCompanySelect.addNewCompany") || "+ Yeni şirkət əlavə et..."}</option>
      </select>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t("crmCompanySelect.modalTitle") || "Yeni CRM Şirkəti"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>{t("crmCompanySelect.companyName") || "Şirkətin adı"} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("crmCompanySelect.companyNamePlaceholder") || "Məs: ABC MMC"}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t("crmCompanySelect.cancel") || "Ləğv et"}
            </Button>
            <Button type="button" onClick={handleCreate} disabled={loading}>
              {loading ? (t("crmCompanySelect.creating") || "Yaradılır...") : (t("crmCompanySelect.create") || "Yarat")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
