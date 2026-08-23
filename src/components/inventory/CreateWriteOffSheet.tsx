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
      toast.error("Ən azı bir sətirdə məhsul, anbar və miqdar doldurulmalıdır");
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
      if (!res.ok) throw new Error(data?.error || "Silinmə sənədi yaradıla bilmədi");

      toast.success(
        status === "COMPLETED" ? `Silinmə icra olundu (${data.reference})` : `Qaralama yadda saxlanıldı (${data.reference})`
      );
      onCreated();
      onOpenChange(false);
      resetState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xəta baş verdi");
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
            <Trash2 className="h-4.5 w-4.5 text-destructive" /> Yeni silinmə
          </SheetTitle>
          <SheetDescription>Yararsız və ya zay olmuş məhsulları anbar qalığından silin.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wof-name">Sənəd adı</Label>
                <Input
                  id="wof-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Silinmə №"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wof-reason">Səbəb / Şərh</Label>
              <Textarea
                id="wof-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Məsələn: son istifadə tarixi keçib, zədələnib..."
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
              warehouseLabel="Anbar"
              quantityLabel="Silinəcək miqdar"
            />
          </div>
        </ScrollArea>

        <SheetFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Ləğv et
            </Button>
            <Button variant="secondary" onClick={() => handleSubmit("DRAFT")} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Yadda saxla
            </Button>
            <Button variant="destructive" onClick={() => handleSubmit("COMPLETED")} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Saxla və icra et
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
