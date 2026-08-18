"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CrmDealCard } from "./CrmDealCard";
import type { CrmStage, CrmDeal } from "./types";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ

interface CrmKanbanColumnProps {
  stage: CrmStage;
  deals: CrmDeal[];
  onAddDeal: () => void;
  onDealClick: (deal: CrmDeal) => void;
}

export function CrmKanbanColumn({ stage, deals, onAddDeal, onDealClick }: CrmKanbanColumnProps) {
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const currency = deals[0]?.currency || "AZN";

  return (
    <div className="flex flex-col w-72 flex-shrink-0 h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold">{stage.name}</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded-full font-medium">
            {deals.length}
          </span>
        </div>
        <button
          onClick={onAddDeal}
          className="p-1 rounded-md hover:bg-[hsl(var(--accent))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          title={t("crmKanbanColumn.addDealTitle") || "Əqd əlavə et"}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <p className="px-3 mb-2 text-[11px] text-[hsl(var(--muted-foreground))]">
        {totalValue.toLocaleString()} {currency} {t("crmKanbanColumn.total") || "məcmu"}
      </p>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-2 overflow-y-auto rounded-xl p-2 transition-colors min-h-20",
          isOver
            ? "bg-[hsl(var(--primary)/0.06)] ring-2 ring-[hsl(var(--primary)/0.3)] ring-dashed"
            : "bg-[hsl(var(--muted)/0.5)]"
        )}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <CrmDealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
          ))}
        </SortableContext>

        {/* Empty state */}
        {deals.length === 0 && !isOver && (
          <div
            className="flex-1 flex items-center justify-center text-xs text-[hsl(var(--muted-foreground)/0.5)] py-8 cursor-pointer"
            onClick={onAddDeal}
          >
            {t("crmKanbanColumn.addDealEmpty") || "+ Əqd əlavə et"}
          </div>
        )}
      </div>
    </div>
  );
}