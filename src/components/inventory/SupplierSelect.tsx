"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Plus, Truck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplierLite } from "./types";

// =============================================================================
// SupplierSelect — Təchizatçı seçici. WarehouseSelect ilə eyni UX-i təkrarlayır:
// heç bir təchizatçı yoxdursa belə, istifadəçi birbaşa buradan yeni təchizatçı
// yaradıb (real POST /api/inventory/suppliers) seçim edə bilir.
// =============================================================================

const CREATE_NEW_VALUE = "__create_new_supplier__";

interface SupplierSelectProps {
  suppliers: SupplierLite[];
  value: string;
  onChange: (supplierId: string) => void;
  onCreated: (supplier: SupplierLite) => void;
  placeholder?: string;
}

export function SupplierSelect({ suppliers, value, onChange, onCreated, placeholder = "Supplier" }: SupplierSelectProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const activeSuppliers = suppliers.filter((s) => s.isActive);

  const handleValueChange = (next: string | null) => {
    if (next === CREATE_NEW_VALUE) {
      setDialogOpen(true);
      return;
    }
    onChange(next ?? "");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Təchizatçı adı tələb olunur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Təchizatçı yaradıla bilmədi");

      onCreated(data);
      onChange(data.id);
      toast.success("Təchizatçı uğurla yaradıldı");
      setDialogOpen(false);
      setName("");
      setPhone("");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Select value={value || undefined} onValueChange={handleValueChange}>
        <SelectTrigger className="h-9 w-full">
          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {activeSuppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
          {activeSuppliers.length > 0 && <SelectSeparator />}
          <SelectItem value={CREATE_NEW_VALUE} className="text-primary">
            <Plus className="h-3.5 w-3.5" /> Create new supplier
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Təchizatçı</DialogTitle>
            <DialogDescription>Təchizatçı yaradıldıqdan sonra dərhal seçim üçün mövcud olacaq.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sup-name">Ad</Label>
              <Input id="sup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Məsələn: ABC Təchizat MMC" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sup-phone">Telefon (ixtiyari)</Label>
                <Input id="sup-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 50 000 00 00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-email">Email (ixtiyari)</Label>
                <Input id="sup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.com" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Ləğv et
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Yarat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
