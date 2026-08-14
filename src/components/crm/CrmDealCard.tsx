"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Calendar, GripVertical } from "lucide-react";
import type { CrmDeal } from "./types";

interface CrmDealCardProps {
  deal: CrmDeal;
  isDragging?: boolean;
  onClick: () => void;
}

// =============================================================================
// CrmDealCard — Kanban-da sürüklənən əqd kartı.
// Mirrors src/components/kanban/TaskCard.tsx: drag handle ayrıca tutacaqdadır,
// beləliklə kartın özünə klik "redaktə" açır, sürükləmə yalnız tutacaqdan başlayır.
// =============================================================================
export function CrmDealCard({ deal, isDragging, onClick }: CrmDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))]",
        "p-3.5 cursor-pointer select-none",
        "hover:border-[hsl(var(--primary)/0.4)] hover:shadow-md transition-all duration-150",
        (isSortableDragging || isDragging) && "opacity-40 shadow-2xl scale-105"
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded text-[hsl(var(--muted-foreground))]"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3" />
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug mb-2.5 line-clamp-2 pl-3 pr-1">
        {deal.title}
      </p>

      {/* Value + probability */}
      <div className="flex items-center justify-between mb-2.5 pl-3">
        <span className="font-semibold text-sm">
          {deal.value?.toLocaleString?.() ?? deal.value} {deal.currency}
        </span>
        {deal.probability > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-medium">
            {deal.probability}%
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[hsl(var(--border)/0.5)] pl-3">
        <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
          {deal.expectedCloseDate && (
            <>
              <Calendar className="w-3 h-3" />
              {new Date(deal.expectedCloseDate).toLocaleDateString()}
            </>
          )}
        </div>

        {deal.assignee ? (
          <div
            className="w-6 h-6 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[10px] text-white font-bold"
            title={deal.assignee.name ?? undefined}
          >
            {deal.assignee.name?.[0]}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-[hsl(var(--border))]" />
        )}
      </div>
    </div>
  );
}
