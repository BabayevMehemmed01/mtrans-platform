"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// My Work — Project card mini tabs ("Haqqında" / "Statistika"), Teamwork-style.
// Purely local UI state; stopPropagation so it never triggers the card's link.
// =============================================================================

const PROJECT_STATUS_LABEL: Record<string, string> = {
  PLANNING: "planlanır",
  ACTIVE: "aktiv",
  ON_HOLD: "dayandırılıb",
  COMPLETED: "tamamlandı",
  CANCELLED: "ləğv edildi",
};

export function ProjectMiniTabs({
  description,
  taskCount,
  memberCount,
  status,
}: {
  description?: string | null;
  taskCount: number;
  memberCount: number;
  status: string;
}) {
  const [tab, setTab] = useState<"about" | "insights">("about");

  return (
    <div onClick={(e) => e.preventDefault()}>
      <div className="flex items-center gap-3 border-b border-border">
        {(["about", "insights"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTab(id);
            }}
            className={cn(
              "-mb-px border-b-2 px-0.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {id === "about" ? "Haqqında" : "Statistika"}
          </button>
        ))}
      </div>
      <div className="min-h-[36px] pt-2 text-xs text-muted-foreground">
        {tab === "about" ? (
          <p className="line-clamp-2">{description || "Təsvir əlavə edilməyib."}</p>
        ) : (
          <div className="flex items-center gap-3">
            <span>{taskCount} tapşırıq</span>
            <span>·</span>
            <span>{memberCount} üzv</span>
            <span>·</span>
            <span className="capitalize">{PROJECT_STATUS_LABEL[status] ?? status}</span>
          </div>
        )}
      </div>
    </div>
  );
}
