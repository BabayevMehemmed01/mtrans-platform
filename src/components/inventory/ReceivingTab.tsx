"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownToLine, Loader2, MoreHorizontal, Play, X } from "lucide-react";
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
// ReceivingTab — Təchizatçıdan mal qəbulu (INBOUND) sənədləri. Transfers/Write-offs
// tablarındakı eyni Draft → Process/Cancel axınını izləyir.
// =============================================================================

interface ReceivingTabProps {
  movements: StockMovementLite[];
  loading: boolean;
  onOpenCreate: () => void;
  onChanged: () => void;
}

export function ReceivingTab({ movements, loading, onOpenCreate, onChanged }: ReceivingTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const receipts = movements.filter((m) => m.type === "INBOUND");

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
      toast.success(action === "process" ? "Qəbul icra olundu, qalıqlar yeniləndi" : "Qəbul sənədi ləğv edildi");
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
        <InventoryTableSkeleton rows={4} cols={6} />
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <InventoryEmptyState
        icon={ArrowDownToLine}
        title="Hələ qəbul sənədi yoxdur"
        description="Təchizatçılardan qəbul olunan mallar (INBOUND) burada görünəcək."
        actionLabel="Yeni Qəbul"
        onAction={onOpenCreate}
        className="min-h-[45vh]"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={onOpenCreate} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <ArrowDownToLine className="h-4 w-4" /> Yeni Qəbul
        </Button>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sənəd №</TableHead>
              <TableHead>Məhsul</TableHead>
              <TableHead>Təchizatçı</TableHead>
              <TableHead>Hədəf anbar</TableHead>
              <TableHead>Miqdar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm font-medium">{m.reference || "—"}</TableCell>
                <TableCell className="text-sm">{m.product?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.supplier?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.toWarehouse?.name ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {m.quantity} {m.product?.unit}
                </TableCell>
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
