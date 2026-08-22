import { Circle, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "./types";

const STATUS_META: Record<
  CampaignStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: {
    label: "Qaralama",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
    icon: Circle,
  },
  SCHEDULED: {
    label: "Planlaşdırılıb",
    className: "bg-blue-50 text-blue-600 border border-blue-200",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "İcrada",
    className: "bg-amber-50 text-amber-600 border border-amber-200",
    icon: Loader2,
  },
  COMPLETED: {
    label: "Tamamlanıb",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    icon: CheckCircle2,
  },
};

export function CampaignStatusBadge({ status, className }: { status: CampaignStatus; className?: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT;
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full px-2.5 py-1 font-medium", meta.className, className)}
    >
      <Icon className={cn("h-3 w-3", status === "IN_PROGRESS" && "animate-spin")} />
      {meta.label}
    </Badge>
  );
}

export function SegmentStatusBadge({ recipientCount }: { recipientCount: number }) {
  if (recipientCount > 0) {
    return (
      <Badge variant="outline" className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> Aktiv
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 rounded-full border-slate-200 bg-slate-100 px-2.5 py-1 font-medium text-slate-500">
      <Circle className="h-3 w-3" /> Boş
    </Badge>
  );
}
