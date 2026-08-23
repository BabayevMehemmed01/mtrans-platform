"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Plus, Warehouse as WarehouseIcon } from "lucide-react";
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
import type { WarehouseLite, WarehouseType } from "./types";

// =============================================================================
// WarehouseSelect — Anbar seçici. Heç bir anbar mövcud olmadıqda belə, istifadəçi
// birbaşa bu komponentdən yeni anbar yaradıb (real POST /api/inventory/warehouses)
// seçim edə bilir — mock data tələb olunmur.
// =============================================================================

const CREATE_NEW_VALUE = "__create_new__";

interface WarehouseSelectProps {
  warehouses: WarehouseLite[];
  value: string;
  onChange: (warehouseId: string) => void;
  onCreated: (warehouse: WarehouseLite) => void;
  placeholder?: string;
}

export function WarehouseSelect({ warehouses, value, onChange, onCreated, placeholder = "Anbar seçin" }: WarehouseSelectProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<WarehouseType>("MAIN");
  const [saving, setSaving] = useState(false);

  const handleValueChange = (next: string | null) => {
    if (next === CREATE_NEW_VALUE) {
      setDialogOpen(true);
      return;
    }
    onChange(next ?? "");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Anbar adı tələb olunur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), location: location.trim() || undefined, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Anbar yaradıla bilmədi");

      onCreated(data);
      onChange(data.id);
      toast.success("Anbar uğurla yaradıldı");
      setDialogOpen(false);
      setName("");
      setLocation("");
      setType("MAIN");
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
          <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {warehouses.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name}
            </SelectItem>
          ))}
          {warehouses.length > 0 && <SelectSeparator />}
          <SelectItem value={CREATE_NEW_VALUE} className="text-primary">
            <Plus className="h-3.5 w-3.5" /> Yeni anbar yarat
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Anbar</DialogTitle>
            <DialogDescription>Anbar yaradıldıqdan sonra dərhal seçim üçün mövcud olacaq.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wh-name">Ad</Label>
              <Input id="wh-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Məsələn: Əsas Anbar — Bakı" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wh-location">Ünvan (ixtiyari)</Label>
              <Input id="wh-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bakı, Sabunçu r." />
            </div>
            <div className="space-y-1.5">
              <Label>Tip</Label>
              <Select value={type} onValueChange={(v) => setType((v as WarehouseType) ?? "MAIN")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">Əsas</SelectItem>
                  <SelectItem value="TRANSIT">Tranzit</SelectItem>
                </SelectContent>
              </Select>
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
