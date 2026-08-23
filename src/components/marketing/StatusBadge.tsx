"use client";

import { Circle, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { CampaignStatus } from "./types";

const STATUS_META: Record<
  CampaignStatus,
  { key: "statusDraft" | "statusScheduled" | "statusInProgress" | "statusCompleted"; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: {
    key: "statusDraft",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
    icon: Circle,
  },
  SCHEDULED: {
    key: "statusScheduled",
    className: "bg-blue-50 text-blue-600 border border-blue-200",
    icon: Clock,
  },
  IN_PROGRESS: {
    key: "statusInProgress",
    className: "bg-amber-50 text-amber-600 border border-amber-200",
    icon: Loader2,
  },
  COMPLETED: {
    key: "statusCompleted",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    icon: CheckCircle2,
  },
};

export function CampaignStatusBadge({ status, className }: { status: CampaignStatus; className?: string }) {
  const t = useT();
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT;
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full px-2.5 py-1 font-medium", meta.className, className)}
    >
      <Icon className={cn("h-3 w-3", status === "IN_PROGRESS" && "animate-spin")} />
      {t(`marketing.${meta.key}`)}
    </Badge>
  );
}

export function SegmentStatusBadge({ recipientCount }: { recipientCount: number }) {
  const t = useT();
  if (recipientCount > 0) {
    return (
      <Badge variant="outline" className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> {t("marketing.statusActive")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 rounded-full border-slate-200 bg-slate-100 px-2.5 py-1 font-medium text-slate-500">
      <Circle className="h-3 w-3" /> {t("marketing.statusEmpty")}
    </Badge>
  );
}
