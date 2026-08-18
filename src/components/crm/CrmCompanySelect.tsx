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

export function CrmCompanySelect({ value, onChange, companies, onCompanyCreated }: CrmCompanySelectProps) {
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__create__") {
      setIsCreateOpen(true);
      return;
    }
    onChange(e.target.value);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error(t("crmCompanySelect.errorNameRequired") || "Şirkət adı mütləqdir");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/crm/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error || (t("crmCompanySelect.errorGeneric") || "Xəta baş verdi"));
      const company = await res.json();
      onCompanyCreated({ id: company.id, name: company.name });
      onChange(company.id);
      toast.success(t("crmCompanySelect.successCreated") || "Şirkət yaradıldı");
      setIsCreateOpen(false);
      setName("");
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("crmCompanySelect.modalTitle") || "Yeni CRM Şirkəti"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("crmCompanySelect.companyName") || "Şirkətin adı"}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("crmCompanySelect.companyNamePlaceholder") || "Məs: ABC MMC"}
                autoFocus
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