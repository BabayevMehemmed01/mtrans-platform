"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, MoreHorizontal, Play, ShoppingCart, X } from "lucide-react";
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
// SalesOrdersTab — Müştəriyə çıxış (OUTBOUND) stok hərəkətlərini "Sales orders"
// kimi göstərir. Real StockMovement məlumatına əsaslanır, mock yoxdur.
// DRAFT sənədlər Transfers/Write-offs tablarındakı kimi Process/Cancel edilə bilər.
// =============================================================================

interface SalesOrdersTabProps {
  movements: StockMovementLite[];
  loading: boolean;
  onOpenCreate: () => void;
  onChanged: () => void;
}

export function SalesOrdersTab({ movements, loading, onOpenCreate, onChanged }: SalesOrdersTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const orders = movements.filter((m) => m.type === "OUTBOUND");

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
      toast.success(action === "process" ? "Göndərmə icra olundu, qalıqlar yeniləndi" : "Göndərmə ləğv edildi");
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

  if (orders.length === 0) {
    return (
      <InventoryEmptyState
        icon={ShoppingCart}
        title="No sales orders yet"
        description="Müştəriyə göndərilən stok hərəkətləri (OUTBOUND) burada görünəcək."
        actionLabel="New Shipment"
        onAction={onOpenCreate}
        className="min-h-[45vh]"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={onOpenCreate} className="gap-1.5">
          <ShoppingCart className="h-4 w-4" /> New Shipment
        </Button>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From warehouse</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((m) => (
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
                <TableCell>
                  <MovementStatusBadge status={m.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString("az-AZ")}
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
                          <Play className="h-4 w-4" /> Process
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleAction(m.id, "cancel")}>
                          <X className="h-4 w-4" /> Cancel
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
