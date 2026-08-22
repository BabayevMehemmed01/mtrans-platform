"use client";

import { ShoppingCart } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { InventoryEmptyState, InventoryTableSkeleton } from "./InventoryEmptyState";
import { MovementStatusBadge } from "./movementMeta";
import type { StockMovementLite } from "./types";

// =============================================================================
// SalesOrdersTab — Müştəriyə çıxış (OUTBOUND) stok hərəkətlərini "Sales orders"
// kimi göstərir. Real StockMovement məlumatına əsaslanır, mock yoxdur.
// =============================================================================

interface SalesOrdersTabProps {
  movements: StockMovementLite[];
  loading: boolean;
}

export function SalesOrdersTab({ movements, loading }: SalesOrdersTabProps) {
  const orders = movements.filter((m) => m.type === "OUTBOUND");

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
        className="min-h-[45vh]"
      />
    );
  }

  return (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
