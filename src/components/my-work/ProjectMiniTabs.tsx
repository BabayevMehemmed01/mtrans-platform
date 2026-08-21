"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// My Work — Project card mini tabs ("About" / "Insights"), Teamwork-style.
// Purely local UI state; stopPropagation so it never triggers the card's link.
// =============================================================================

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
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {id === "about" ? "About" : "Insights"}
          </button>
        ))}
      </div>
      <div className="min-h-[36px] pt-2 text-xs text-muted-foreground">
        {tab === "about" ? (
          <p className="line-clamp-2">{description || "No description provided."}</p>
        ) : (
          <div className="flex items-center gap-3">
            <span>{taskCount} tasks</span>
            <span>·</span>
            <span>{memberCount} members</span>
            <span>·</span>
            <span className="capitalize">{status.toLowerCase().replace("_", " ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
