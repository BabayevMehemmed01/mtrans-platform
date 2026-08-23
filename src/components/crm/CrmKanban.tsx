"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CrmKanbanColumn } from "./CrmKanbanColumn";
import { CrmDealCard } from "./CrmDealCard";
import { CrmDealDialog } from "./CrmDealDialog";
import { CrmStageDialog } from "./CrmStageDialog";
import type { CrmBoard } from "./useCrmBoard";
import type { CrmDeal } from "./types";
import { CRM_TRASH_ID } from "./crmUtils";

interface CrmKanbanProps {
  board: CrmBoard;
}

const crmCollisionDetection: CollisionDetection = (args) => {
  // Trash yalnız kursorun üzərində olanda qalib gəlsin — kartın kölgəsi
  // aşağıya yaxın olanda səhvən silinmənin qarşısını alır.
  const pointerHits = pointerWithin(args);
  const trashFromPointer = pointerHits.find((c) => c.id === CRM_TRASH_ID);
  if (trashFromPointer) return [trashFromPointer];
  return closestCorners(args);
};

// =============================================================================
// CrmKanban — CRM Satış Qıfı (Deals Kanban)
// dnd-kit ilə qurulmuşdur — src/components/kanban/KanbanBoard.tsx-in eyni
// DndContext / SortableContext / useSensor(PointerSensor) / DragOverlay
// nümunəsini təkrarlayır (əvvəllər @hello-pangea/dnd istifadə olunurdu).
// =============================================================================
export default function CrmKanban({ board }: CrmKanbanProps) {
  // YENİ: Tərcümə mühərrikini qoşuruq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { stages, setStages, deals, setDeals, contacts, companies, setCompanies, members, loading, refetch } = board;

  const [activeDeal, setActiveDeal] = useState<CrmDeal | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    deal: CrmDeal | null;
    defaultStageId?: string;
  }>({ open: false, mode: "create", deal: null });
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // ---- Drag Handlers ----
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  }, [deals]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || over.id === CRM_TRASH_ID) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // over → bir mərhələ (stage) sütunudur
    const overStage = stages.find((s) => s.id === overId);
    if (overStage) {
      setDeals((prev) =>
        prev.map((d) => (d.id === activeId ? { ...d, stageId: overStage.id } : d))
      );
      return;
    }

    // over → başqa bir əqd kartının üzərindəyik
    const overDeal = deals.find((d) => d.id === overId);
    if (!overDeal) return;

    setDeals((prev) => {
      const activeIndex = prev.findIndex((d) => d.id === activeId);
      const overIndex = prev.findIndex((d) => d.id === overId);
      if (activeIndex < 0 || overIndex < 0) return prev;
      const updated = [...prev];
      if (updated[activeIndex].stageId !== overDeal.stageId) {
        updated[activeIndex] = { ...updated[activeIndex], stageId: overDeal.stageId };
      }
      return arrayMove(updated, activeIndex, overIndex);
    });
  }, [stages, deals, setDeals]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    const dragged = activeDeal;
    setActiveDeal(null);
    if (!over) return;

    const activeId = active.id as string;

    if (over.id === CRM_TRASH_ID || over.data.current?.type === "trash") {
      setDeals((prev) => prev.filter((d) => d.id !== activeId));
      try {
        const res = await fetch(`/api/crm/deals/${activeId}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success(t("crmKanban.successDeleted") || t("crmDealDialog.successDeleted") || "Əqd silindi");
      } catch {
        toast.error(t("crmKanban.errorDelete") || t("crmDealDialog.errorDelete") || "Əqd silinərkən xəta baş verdi");
        refetch();
      }
      return;
    }

    const movedDeal = deals.find((d) => d.id === activeId) ?? dragged;
    if (!movedDeal) return;

    try {
      const res = await fetch(`/api/crm/deals/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: movedDeal.stageId }),
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      console.error("Deal stage update failed:", err);
      toast.error(t("crmKanban.errorStageUpdate") || "Əqdin mərhələsi yenilənmədi");
      refetch();
    }
  }, [activeDeal, deals, refetch, setDeals, t]);

  const handleDragCancel = useCallback(() => {
    setActiveDeal(null);
  }, []);

  // ---- Dialog helpers ----
  const openCreate = (stageId?: string) =>
    setDialogState({ open: true, mode: "create", deal: null, defaultStageId: stageId ?? stages[0]?.id });
  const openEdit = (deal: CrmDeal) => setDialogState({ open: true, mode: "edit", deal });

  const handleCreated = (deal: CrmDeal) => setDeals((prev) => [deal, ...prev]);
  const handleUpdated = (deal: CrmDeal) => setDeals((prev) => prev.map((d) => (d.id === deal.id ? deal : d)));
  const handleDeleted = (dealId: string) => setDeals((prev) => prev.filter((d) => d.id !== dealId));

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{t("crmKanban.loading") || "Yüklənir..."}</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("crmKanban.salesFunnel") || "Deals"}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsStageDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t("crmKanban.newStageBtn") || "Yeni Mərhələ"}
          </Button>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="mr-2 h-4 w-4" /> {t("crmKanban.newDealBtn") || "Yeni Əqd"}
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={crmCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToWindowEdges]}
      >
        <div className={cn("h-[calc(100vh-250px)] overflow-x-auto pb-4", activeDeal && "pb-28")}>
          <div className="flex gap-4 h-full">
            {stages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stageId === stage.id);
              return (
                <SortableContext
                  key={stage.id}
                  id={stage.id}
                  items={stageDeals.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <CrmKanbanColumn
                    stage={stage}
                    deals={stageDeals}
                    onAddDeal={() => openCreate(stage.id)}
                    onDealClick={openEdit}
                  />
                </SortableContext>
              );
            })}
          </div>
        </div>

        <CrmTrashDropzone isDragging={!!activeDeal} />

        {/* Drag Overlay — sürüklənən kartın "kölgəsi" */}
        <DragOverlay>
          {activeDeal ? <CrmDealCard deal={activeDeal} isDragging onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      <CrmDealDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
        mode={dialogState.mode}
        deal={dialogState.deal}
        defaultStageId={dialogState.defaultStageId}
        stages={stages}
        members={members}
        contacts={contacts}
        companies={companies}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        onCompanyCreated={(c) => setCompanies((prev) => [...prev, c])}
      />

      <CrmStageDialog
        open={isStageDialogOpen}
        onOpenChange={setIsStageDialogOpen}
        onCreated={(stage) => setStages((prev) => [...prev, stage])}
      />
    </div>
  );
}

function CrmTrashDropzone({ isDragging }: { isDragging: boolean }) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  const { setNodeRef, isOver } = useDroppable({
    id: CRM_TRASH_ID,
    data: { type: "trash" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "fixed inset-x-4 bottom-4 z-50",
        isDragging ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!isDragging}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-6 text-base font-semibold text-white shadow-2xl transition-all duration-200",
          isDragging ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          isOver ? "scale-[1.02] border-white/80 bg-red-600" : "border-red-200/60 bg-red-500"
        )}
      >
        <Trash2 className="h-7 w-7" />
        {t("crmKanban.dropToDelete") || "Silmək üçün bura buraxın"}
      </div>
    </div>
  );
}
