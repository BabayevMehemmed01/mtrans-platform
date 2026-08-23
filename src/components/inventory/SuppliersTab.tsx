"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Mail, Phone, MapPin, Truck, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { InventoryEmptyState, InventoryTableSkeleton } from "./InventoryEmptyState";
import { SupplierDialog } from "./SupplierDialog";
import type { SupplierLite } from "./types";

// =============================================================================
// SuppliersTab — Təchizatçıların tam siyahısı: axtarış, yaratma, redaktə,
// aktiv/deaktiv statusu və sənəd sayı (neçə Receiving sənədində istifadə olunub).
// =============================================================================

interface SuppliersTabProps {
  suppliers: SupplierLite[];
  loading: boolean;
  onCreated: (supplier: SupplierLite) => void;
  onUpdated: (supplier: SupplierLite) => void;
}

export function SuppliersTab({ suppliers, loading, onCreated, onUpdated }: SuppliersTabProps) {
  const [search, setSearch] = useState("");
  const [dialogState, setDialogState] = useState<{ open: boolean; mode: "create" | "edit"; supplier: SupplierLite | null }>({
    open: false,
    mode: "create",
    supplier: null,
  });

  const filtered = useMemo(
    () =>
      suppliers.filter((s) =>
        search
          ? s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.contactName || "").toLowerCase().includes(search.toLowerCase()) ||
            (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (s.phone || "").toLowerCase().includes(search.toLowerCase())
          : true
      ),
    [suppliers, search]
  );

  const openCreate = () => setDialogState({ open: true, mode: "create", supplier: null });
  const openEdit = (supplier: SupplierLite) => setDialogState({ open: true, mode: "edit", supplier });

  if (loading) {
    return (
      <div className="rounded-2xl shadow-sm">
        <InventoryTableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <>
        <InventoryEmptyState
          icon={Truck}
          title="Hələ təchizatçı yoxdur"
          description="Məhsul qəbulu sənədləri üçün təchizatçı əlavə edin."
          actionLabel="Yeni Təchizatçı"
          onAction={openCreate}
          className="min-h-[45vh]"
        />
        <SupplierDialog
          open={dialogState.open}
          onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
          mode={dialogState.mode}
          supplier={dialogState.supplier}
          onCreated={onCreated}
          onUpdated={onUpdated}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Təchizatçı axtar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni Təchizatçı
        </Button>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Təchizatçı</TableHead>
              <TableHead>Əlaqə</TableHead>
              <TableHead>Ünvan</TableHead>
              <TableHead>Sənədlər</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[44px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Axtarışa uyğun təchizatçı tapılmadı
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id} className={cn(!s.isActive && "opacity-50")}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <Truck className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.name}</p>
                        {s.contactName && <p className="truncate text-xs text-muted-foreground">{s.contactName}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {s.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {s.email}
                        </span>
                      )}
                      {s.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {s.phone}
                        </span>
                      )}
                      {!s.email && !s.phone && "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.address ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> {s.address}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s._count?.stockMovements ?? 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2.5 py-1 font-medium",
                        s.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-slate-100 text-slate-500"
                      )}
                    >
                      {s.isActive ? "Aktiv" : "Deaktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
        mode={dialogState.mode}
        supplier={dialogState.supplier}
        onCreated={onCreated}
        onUpdated={onUpdated}
      />
    </div>
  );
}
