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
import { useT } from "@/hooks/useT";
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
  const t = useT();
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
      if (!res.ok) throw new Error(data?.error || t("inventory.actionFailed"));
      toast.success(action === "process" ? t("inventory.receivingProcessed") : t("inventory.receivingCancelled"));
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("inventory.errorGeneric"));
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
        title={t("inventory.noReceiving")}
        description={t("inventory.noReceivingHint")}
        actionLabel={t("inventory.newReceiving")}
        onAction={onOpenCreate}
        className="min-h-[45vh]"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={onOpenCreate} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <ArrowDownToLine className="h-4 w-4" /> {t("inventory.newReceiving")}
        </Button>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inventory.docNo")}</TableHead>
              <TableHead>{t("inventory.product")}</TableHead>
              <TableHead>{t("inventory.supplier")}</TableHead>
              <TableHead>{t("inventory.targetWarehouse")}</TableHead>
              <TableHead>{t("inventory.quantity")}</TableHead>
              <TableHead>{t("inventory.status")}</TableHead>
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
                          <Play className="h-4 w-4" /> {t("inventory.process")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleAction(m.id, "cancel")}>
                          <X className="h-4 w-4" /> {t("inventory.cancel")}
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
