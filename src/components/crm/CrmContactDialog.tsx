"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CrmCompanySelect } from "./CrmCompanySelect";
import type { CrmContact, CrmCompanyLite } from "./types";

interface CrmContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  contact?: CrmContact | null;
  companies: CrmCompanyLite[];
  onCreated: (contact: CrmContact) => void;
  onUpdated: (contact: CrmContact) => void;
  onDeleted: (contactId: string) => void;
  onCompanyCreated: (company: CrmCompanyLite) => void;
}

function emptyForm() {
  return { firstName: "", lastName: "", email: "", phone: "", position: "", crmCompanyId: "" };
}

// =============================================================================
// CrmContactDialog — Əlaqə (contact) yaratma / redaktə forması.
// PATCH/DELETE /api/crm/contacts/[id] bu komponent üçün əlavə olunub.
// =============================================================================
export function CrmContactDialog({
  open,
  onOpenChange,
  mode,
  contact,
  companies,
  onCreated,
  onUpdated,
  onDeleted,
  onCompanyCreated,
}: CrmContactDialogProps) {
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && contact) {
      setForm({
        firstName: contact.firstName,
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        position: contact.position || "",
        crmCompanyId: contact.crmCompanyId || "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, mode, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      toast.error("Ad mütləqdir");
      return;
    }
    setLoading(true);
    try {
      const url = mode === "create" ? "/api/crm/contacts" : `/api/crm/contacts/${contact!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, crmCompanyId: form.crmCompanyId || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      const data = await res.json();
      if (mode === "create") {
        onCreated(data);
        toast.success("Əlaqə yaradıldı");
      } else {
        onUpdated(data);
        toast.success("Əlaqə yeniləndi");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (!confirm(`${contact.firstName} ${contact.lastName || ""} əlaqəsini silmək istədiyinizə əminsiniz?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xəta baş verdi");
      onDeleted(contact.id);
      toast.success("Əlaqə silindi");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Əlaqə silinərkən xəta baş verdi");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Yeni Müştəri Əlavə Et" : "Əlaqəni Redaktə Et"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ad</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Soyad</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Vəzifə</Label>
            <Input
              value={form.position}
              onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Əlaqədar Şirkət</Label>
            <CrmCompanySelect
              value={form.crmCompanyId}
              onChange={(id) => setForm((p) => ({ ...p, crmCompanyId: id }))}
              companies={companies}
              onCompanyCreated={onCompanyCreated}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {mode === "edit" ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" /> {deleting ? "Silinir..." : "Sil"}
              </Button>
            ) : <span />}
            <Button type="submit" disabled={loading}>
              {loading ? "Yadda saxlanılır..." : "Yadda saxla"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
