"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, MoreHorizontal, Play, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryEmptyState, InventoryTableSkeleton } from "./InventoryEmptyState";
import { MovementStatusBadge } from "./movementMeta";
import type { StockMovementLite } from "./types";

// =============================================================================
// WriteOffsTab — Yararsız/zay silinməsi (SCRAP) sənədləri.
// =============================================================================

interface WriteOffsTabProps {
  movements: StockMovementLite[];
  loading: boolean;
  onOpenCreate: () => void;
  onChanged: () => void;
}

export function WriteOffsTab({ movements, loading, onOpenCreate, onChanged }: WriteOffsTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const writeOffs = movements.filter((m) => m.type === "SCRAP");

  const handleAction = async (id: string, action: "process" | "cancel") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/inventory/movements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Əməliyyat uğursuz oldu");
      toast.success(action === "process" ? "Silinmə icra olundu, qalıqlar yeniləndi" : "Sənəd ləğv edildi");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xəta baş verdi");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl shadow-sm">
        <InventoryTableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  if (writeOffs.length === 0) {
    return (
      <InventoryEmptyState
        icon={Trash2}
        title="Hələ silinmə sənədi yoxdur"
        description="Yararsız/zay olmuş məhsulların silinmə sənədləri burada görünəcək."
        actionLabel="Yeni silinmə"
        onAction={onOpenCreate}
        className="min-h-[45vh]"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={onOpenCreate} variant="destructive" className="gap-1.5">
          <Trash2 className="h-4 w-4" /> Yeni silinmə
        </Button>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İstinad</TableHead>
              <TableHead>Məhsul</TableHead>
              <TableHead>Anbar</TableHead>
              <TableHead>Miqdar</TableHead>
              <TableHead>Dəyər</TableHead>
              <TableHead>Səbəb</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {writeOffs.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm font-medium">{m.reference || "—"}</TableCell>
                <TableCell className="text-sm">{m.product?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.fromWarehouse?.name ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {m.quantity} {m.product?.unit}
                </TableCell>
                <TableCell className="text-sm">
                  {m.totalAmount.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {m.currency}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{m.comment || "—"}</TableCell>
                <TableCell>
                  <MovementStatusBadge status={m.status} />
                </TableCell>
                <TableCell>
                  {m.status === "DRAFT" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={busyId === m.id}>
                          {busyId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="gap-2" onClick={() => handleAction(m.id, "process")}>
                          <Play className="h-4 w-4" /> İcra et
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleAction(m.id, "cancel")}>
                          <X className="h-4 w-4" /> Ləğv et
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
