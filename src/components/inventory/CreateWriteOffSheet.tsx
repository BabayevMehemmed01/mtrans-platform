"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useT } from "@/hooks/useT";
import { ProductLinesTable } from "./ProductLinesTable";
import { emptyLine } from "./types";
import type { ProductLite, StockMovementLineDraft, WarehouseLite } from "./types";

// =============================================================================
// CreateWriteOffSheet — Yararsız/zay məhsulların silinməsi (SCRAP) sənədi.
// =============================================================================

interface CreateWriteOffSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductLite[];
  warehouses: WarehouseLite[];
  onProductCreated: (product: ProductLite) => void;
  onWarehouseCreated: (warehouse: WarehouseLite) => void;
  onCreated: () => void;
}

export function CreateWriteOffSheet({
  open,
  onOpenChange,
  products,
  warehouses,
  onProductCreated,
  onWarehouseCreated,
  onCreated,
}: CreateWriteOffSheetProps) {
  const t = useT();
  const [documentName, setDocumentName] = useState("");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<StockMovementLineDraft[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setDocumentName("");
    setReason("");
    setLines([emptyLine()]);
  };

  const handleSubmit = async (status: "DRAFT" | "COMPLETED") => {
    const validLines = lines.filter((l) => l.productId && l.warehouseId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error(t("inventory.lineRequired"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SCRAP",
          status,
          reference: documentName.trim() || undefined,
          comment: reason.trim() || undefined,
          lines: validLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitCost: l.unitCost,
            fromWarehouseId: l.warehouseId,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("inventory.writeOffCreateFailed"));

      toast.success(
        status === "COMPLETED"
          ? t("inventory.writeOffCompleted").replace("{ref}", data.reference)
          : t("inventory.writeOffDraftSaved").replace("{ref}", data.reference)
      );
      onCreated();
      onOpenChange(false);
      resetState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("inventory.errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-4xl">
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="flex items-center gap-2">
            <Trash2 className="h-4.5 w-4.5 text-destructive" /> {t("inventory.newWriteOffTitle")}
          </SheetTitle>
          <SheetDescription>{t("inventory.writeOffDesc")}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-6 py-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="wof-name">{t("inventory.documentName")}</Label>
                <Input
                  id="wof-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder={t("inventory.writeOffNamePrefix")}
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wof-reason">{t("inventory.reason")}</Label>
              <Textarea
                id="wof-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("inventory.noteWriteOffPlaceholder")}
                className="min-h-20"
              />
            </div>

            <ProductLinesTable
              lines={lines}
              onLinesChange={setLines}
              products={products}
              warehouses={warehouses}
              onProductCreated={onProductCreated}
              onWarehouseCreated={onWarehouseCreated}
              showPrices
              warehouseMode="single"
              warehouseLabel={t("inventory.warehouse")}
              quantityLabel={t("inventory.quantity")}
            />
          </div>
        </ScrollArea>

        <SheetFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("inventory.cancel")}
            </Button>
            <Button variant="secondary" onClick={() => handleSubmit("DRAFT")} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("inventory.saveDraft")}
            </Button>
            <Button variant="destructive" onClick={() => handleSubmit("COMPLETED")} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("inventory.saveAndProcess")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
