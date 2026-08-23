"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeftRight, Loader2, MoreHorizontal, Play, X } from "lucide-react";
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
// TransfersTab — Anbarlar arası daxili köçürmə (TRANSFER) sənədləri.
// =============================================================================

interface TransfersTabProps {
  movements: StockMovementLite[];
  loading: boolean;
  onOpenCreate: () => void;
  onChanged: () => void;
}

export function TransfersTab({ movements, loading, onOpenCreate, onChanged }: TransfersTabProps) {
  const t = useT();
  const [busyId, setBusyId] = useState<string | null>(null);
  const transfers = movements.filter((m) => m.type === "TRANSFER");

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
      toast.success(action === "process" ? t("inventory.transferProcessed") : t("inventory.transferCancelled"));
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

  if (transfers.length === 0) {
    return (
      <InventoryEmptyState
        icon={ArrowLeftRight}
        title={t("inventory.noTransfers")}
        description={t("inventory.noTransfersHint")}
        actionLabel={t("inventory.newTransfer")}
        onAction={onOpenCreate}
        className="min-h-[45vh]"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={onOpenCreate} className="gap-1.5">
          <ArrowLeftRight className="h-4 w-4" /> {t("inventory.newTransfer")}
        </Button>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inventory.reference")}</TableHead>
              <TableHead>{t("inventory.product")}</TableHead>
              <TableHead>{t("inventory.from")}</TableHead>
              <TableHead>{t("inventory.to")}</TableHead>
              <TableHead>{t("inventory.quantity")}</TableHead>
              <TableHead>{t("inventory.status")}</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm font-medium">{m.reference || "—"}</TableCell>
                <TableCell className="text-sm">{m.product?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.fromWarehouse?.name ?? "—"}</TableCell>
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
