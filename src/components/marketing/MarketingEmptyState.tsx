"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

// =============================================================================
// Premium boş ekran (empty state) + yüklənmə (skeleton) vəziyyətləri.
// Bütün Marketing modulu boyunca vahid görünüş üçün paylaşılır.
// =============================================================================

export function MarketingEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  const t = useT();
  const resolvedTitle = title ?? t("marketing.noDataFound");
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-foreground/10">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
        {description && (
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function MarketingTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 rounded-xl px-3 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-1/4" : "flex-1 max-w-[140px]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MarketingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}
