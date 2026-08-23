"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ClipboardEdit,
  Trash2,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { StockMovementStatus, StockMovementType } from "./types";

// =============================================================================
// Stok hərəkəti tip/status meta-ları — Marketing modulundaki channelMeta.tsx
// nümunəsinə uyğun vahid görünüş üçün.
// =============================================================================

export const MOVEMENT_TYPE_META: Record<
  StockMovementType,
  { icon: LucideIcon; accent: string; softBg: string }
> = {
  INBOUND: { icon: ArrowDownToLine, accent: "text-emerald-600", softBg: "bg-emerald-50" },
  OUTBOUND: { icon: ArrowUpFromLine, accent: "text-blue-600", softBg: "bg-blue-50" },
  TRANSFER: { icon: ArrowLeftRight, accent: "text-purple-600", softBg: "bg-purple-50" },
  ADJUSTMENT: { icon: ClipboardEdit, accent: "text-amber-600", softBg: "bg-amber-50" },
  SCRAP: { icon: Trash2, accent: "text-red-600", softBg: "bg-red-50" },
};

const TYPE_LABEL_KEYS: Record<StockMovementType, string> = {
  INBOUND: "inventory.typeInbound",
  OUTBOUND: "inventory.typeOutbound",
  TRANSFER: "inventory.typeTransfer",
  ADJUSTMENT: "inventory.typeAdjustment",
  SCRAP: "inventory.typeScrap",
};

const STATUS_META: Record<
  StockMovementStatus,
  { className: string; icon: LucideIcon; labelKey: string }
> = {
  DRAFT: { className: "bg-slate-100 text-slate-600 border border-slate-200", icon: Circle, labelKey: "inventory.statusDraft" },
  PENDING: { className: "bg-amber-50 text-amber-600 border border-amber-200", icon: Clock, labelKey: "inventory.statusPending" },
  COMPLETED: { className: "bg-emerald-50 text-emerald-600 border border-emerald-200", icon: CheckCircle2, labelKey: "inventory.statusCompleted" },
  CANCELLED: { className: "bg-red-50 text-red-500 border border-red-200", icon: XCircle, labelKey: "inventory.statusCancelled" },
};

export function MovementStatusBadge({ status, className }: { status: StockMovementStatus; className?: string }) {
  const t = useT();
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full px-2.5 py-1 font-medium", meta.className, className)}>
      <Icon className="h-3 w-3" />
      {t(meta.labelKey)}
    </Badge>
  );
}

export function MovementTypeBadge({ type, className }: { type: StockMovementType; className?: string }) {
  const t = useT();
  const meta = MOVEMENT_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full px-2.5 py-1 font-medium border-transparent", meta.softBg, meta.accent, className)}>
      <Icon className="h-3 w-3" />
      {t(TYPE_LABEL_KEYS[type])}
    </Badge>
  );
}
