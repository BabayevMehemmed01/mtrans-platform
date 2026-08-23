"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/useT";
import type { SupplierLite } from "./types";

// =============================================================================
// SupplierDialog — Təchizatçının tam CRUD formu (Suppliers tab-ından açılır).
// =============================================================================

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  supplier?: SupplierLite | null;
  onCreated: (supplier: SupplierLite) => void;
  onUpdated: (supplier: SupplierLite) => void;
}

function emptyForm() {
  return { name: "", contactName: "", phone: "", email: "", address: "", taxId: "" };
}

export function SupplierDialog({ open, onOpenChange, mode, supplier, onCreated, onUpdated }: SupplierDialogProps) {
  const t = useT();
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && supplier) {
      setForm({
        name: supplier.name,
        contactName: supplier.contactName || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        taxId: supplier.taxId || "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, mode, supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("inventory.supplierNameRequired"));
      return;
    }
    setLoading(true);
    try {
      const url = mode === "create" ? "/api/inventory/suppliers" : `/api/inventory/suppliers/${supplier!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("inventory.errorGeneric"));
      if (mode === "create") {
        onCreated(data);
        toast.success(t("inventory.supplierCreated"));
      } else {
        onUpdated(data);
        toast.success(t("inventory.supplierUpdated"));
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("inventory.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!supplier) return;
    setToggling(true);
    try {
      const nextActive = !supplier.isActive;
      const res = await fetch(`/api/inventory/suppliers/${supplier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("inventory.errorGeneric"));
      onUpdated(data);
      toast.success(nextActive ? t("inventory.supplierActivated") : t("inventory.supplierDeactivated"));
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("inventory.errorGeneric"));
    } finally {
      setToggling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("inventory.newSupplier") : t("inventory.editSupplier")}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? t("inventory.supplierCreateHint") : t("inventory.supplierEditHint")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2 col-span-2">
              <Label>{t("inventory.companyNameRequired")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("inventory.supplierNamePlaceholder")}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("inventory.contactPerson")}</Label>
              <Input value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} placeholder={t("inventory.contactPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("inventory.taxId")}</Label>
              <Input value={form.taxId} onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("inventory.phone")}</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+994 50 000 00 00" />
            </div>
            <div className="space-y-2">
              <Label>{t("inventory.email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="info@company.com" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>{t("inventory.address")}</Label>
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {mode === "edit" && supplier ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleActive}
                disabled={toggling}
                className={supplier.isActive ? "text-destructive hover:text-destructive" : "text-emerald-600 hover:text-emerald-600"}
              >
                {toggling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : supplier.isActive ? <Trash2 className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                {supplier.isActive ? t("inventory.deactivate") : t("inventory.activate")}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("inventory.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
