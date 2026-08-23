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
import type { StockMovementStatus, StockMovementType } from "./types";

// =============================================================================
// Stok hərəkəti tip/status meta-ları — Marketing modulundaki channelMeta.tsx
// nümunəsinə uyğun vahid görünüş üçün.
// =============================================================================

export const MOVEMENT_TYPE_META: Record<
  StockMovementType,
  { label: string; icon: LucideIcon; accent: string; softBg: string }
> = {
  INBOUND: { label: "Qəbul", icon: ArrowDownToLine, accent: "text-emerald-600", softBg: "bg-emerald-50" },
  OUTBOUND: { label: "Göndərmə", icon: ArrowUpFromLine, accent: "text-blue-600", softBg: "bg-blue-50" },
  TRANSFER: { label: "Köçürmə", icon: ArrowLeftRight, accent: "text-purple-600", softBg: "bg-purple-50" },
  ADJUSTMENT: { label: "Tənzimləmə", icon: ClipboardEdit, accent: "text-amber-600", softBg: "bg-amber-50" },
  SCRAP: { label: "Silinmə", icon: Trash2, accent: "text-red-600", softBg: "bg-red-50" },
};

const STATUS_META: Record<
  StockMovementStatus,
  { label: string; className: string; icon: LucideIcon }
> = {
  DRAFT: { label: "Qaralama", className: "bg-slate-100 text-slate-600 border border-slate-200", icon: Circle },
  PENDING: { label: "Gözləyir", className: "bg-amber-50 text-amber-600 border border-amber-200", icon: Clock },
  COMPLETED: { label: "İcra olunub", className: "bg-emerald-50 text-emerald-600 border border-emerald-200", icon: CheckCircle2 },
  CANCELLED: { label: "Ləğv edilib", className: "bg-red-50 text-red-500 border border-red-200", icon: XCircle },
};

export function MovementStatusBadge({ status, className }: { status: StockMovementStatus; className?: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full px-2.5 py-1 font-medium", meta.className, className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export function MovementTypeBadge({ type, className }: { type: StockMovementType; className?: string }) {
  const meta = MOVEMENT_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full px-2.5 py-1 font-medium border-transparent", meta.softBg, meta.accent, className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}
