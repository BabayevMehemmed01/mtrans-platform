"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, MoreVertical, Pencil, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CrmDealCard } from "./CrmDealCard";
import type { CrmStage, CrmDeal } from "./types";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { formatStageValueTotals, getBitrixStageColor } from "./crmUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface CrmKanbanColumnProps {
  stage: CrmStage;
  deals: CrmDeal[];
  onAddDeal: () => void;
  onDealClick: (deal: CrmDeal) => void;
  onEditStage: () => void;
  onMoveStage: (direction: "left" | "right") => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

export function CrmKanbanColumn({
  stage,
  deals,
  onAddDeal,
  onDealClick,
  onEditStage,
  onMoveStage,
  canMoveLeft,
  canMoveRight,
}: CrmKanbanColumnProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalsLabel = formatStageValueTotals(deals);
  const headerColor = getBitrixStageColor(stage);

  return (
    <div className="flex flex-col w-72 flex-shrink-0 h-full rounded-xl overflow-hidden border border-border/60 bg-muted/35">
      {/* Bitrix24 solid-color column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 text-white"
        style={{ backgroundColor: headerColor }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">{stage.name}</span>
          <span className="text-[11px] bg-white/25 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onAddDeal}
            className="p-1 rounded-md hover:bg-white/20 transition-colors"
            title={t("crmKanbanColumn.addDealTitle") || "Əqd əlavə et"}
          >
            <Plus className="w-4 h-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-md hover:bg-white/20 transition-colors"
                title={t("crmKanbanColumn.stageOptionsTitle") || "Mərhələ ayarları"}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEditStage}>
                <Pencil className="mr-2 h-4 w-4" /> {t("crmKanbanColumn.editStage") || "Redaktə et"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!canMoveLeft} onSelect={() => onMoveStage("left")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("crmKanbanColumn.moveLeft") || "Sola köçür"}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canMoveRight} onSelect={() => onMoveStage("right")}>
                <ArrowRight className="mr-2 h-4 w-4" /> {t("crmKanbanColumn.moveRight") || "Sağa köçür"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p className="px-3 py-1.5 text-[11px] font-medium text-white/90 leading-snug" style={{ backgroundColor: headerColor }}>
        {totalsLabel} {t("crmKanbanColumn.total") || "məcmu"}
      </p>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-2 overflow-y-auto p-2 transition-colors min-h-20",
          isOver
            ? "bg-primary/6 ring-2 ring-inset ring-primary/30 ring-dashed"
            : ""
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

        {deals.length === 0 && !isOver && (
          <div
            className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 py-8 cursor-pointer"
            onClick={onAddDeal}
          >
            {t("crmKanbanColumn.addDealEmpty") || "+ Əqd əlavə et"}
          </div>
        )}
      </div>
    </div>
  );
}
