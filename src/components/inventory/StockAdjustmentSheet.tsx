"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ClipboardEdit, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useT } from "@/hooks/useT";
import { ProductLinesTable } from "./ProductLinesTable";
import { emptyLine } from "./types";
import type { ProductLite, StockMovementLineDraft, WarehouseLite } from "./types";

// =============================================================================
// StockAdjustmentSheet — "Stock adjustment" sənədi. Sağdan açılan tam-hündürlüklü
// Sheet, 2 tab: General (sənəd başlığı) və Products (məhsul sətirləri cədvəli).
// "Save" → DRAFT (qalıqlara toxunmur). "Save and Process" → COMPLETED
// (InventoryLevel-ə $transaction ilə dərhal tətbiq olunur).
// =============================================================================

const CURRENCIES = ["AZN", "USD", "EUR", "RUB", "TRY"];

interface StockAdjustmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductLite[];
  warehouses: WarehouseLite[];
  onProductCreated: (product: ProductLite) => void;
  onWarehouseCreated: (warehouse: WarehouseLite) => void;
  onCreated: () => void;
}

export function StockAdjustmentSheet({
  open,
  onOpenChange,
  products,
  warehouses,
  onProductCreated,
  onWarehouseCreated,
  onCreated,
}: StockAdjustmentSheetProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState("general");
  const [documentName, setDocumentName] = useState("");
  const [currency, setCurrency] = useState("AZN");
  const [comment, setComment] = useState("");
  const [stage, setStage] = useState<"DRAFT" | "COMPLETED">("DRAFT");
  const [lines, setLines] = useState<StockMovementLineDraft[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setActiveTab("general");
    setDocumentName("");
    setCurrency("AZN");
    setComment("");
    setStage("DRAFT");
    setLines([emptyLine()]);
  };

  const totalAmount = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);

  const handleSubmit = async (status: "DRAFT" | "COMPLETED") => {
    const validLines = lines.filter((l) => l.productId && l.warehouseId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error(t("inventory.lineRequired"));
      setActiveTab("products");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADJUSTMENT",
          status,
          reference: documentName.trim() || undefined,
          comment: comment.trim() || undefined,
          currency,
          lines: validLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitCost: l.unitCost,
            unitPrice: l.unitPrice,
            toWarehouseId: l.warehouseId,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("inventory.adjustmentCreateFailed"));

      toast.success(
        status === "COMPLETED"
          ? t("inventory.adjustmentCompleted").replace("{ref}", data.reference)
          : t("inventory.adjustmentDraftSaved").replace("{ref}", data.reference)
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
            <ClipboardEdit className="h-4.5 w-4.5 text-primary" /> {t("inventory.stockAdjustment")}
          </SheetTitle>
          <SheetDescription>
            {t("inventory.adjustmentDesc")}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border/60 px-6">
            <TabsList className="h-auto justify-start gap-1 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="general"
                className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t("inventory.tabGeneral")}
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t("inventory.tabProducts")} {lines.filter((l) => l.productId).length > 0 && `(${lines.filter((l) => l.productId).length})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="general" className="m-0 space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="doc-name">{t("inventory.documentName")}</Label>
                <Input
                  id="doc-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder={t("inventory.adjustmentNamePrefix")}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("inventory.currency")}</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v ?? "AZN")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("inventory.stage")}</Label>
                  <Select value={stage} onValueChange={(v) => setStage((v as "DRAFT" | "COMPLETED") ?? "DRAFT")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">{t("inventory.statusDraft")}</SelectItem>
                      <SelectItem value="COMPLETED">{t("inventory.statusCompleted")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-comment">{t("inventory.comment")}</Label>
                <Textarea
                  id="doc-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("inventory.noteAdjustmentPlaceholder")}
                  className="min-h-24"
                />
              </div>
            </TabsContent>

            <TabsContent value="products" className="m-0 px-6 py-5">
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
                quantityLabel={t("inventory.incomingQty")}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-sm">
              <span className="text-muted-foreground">{t("inventory.totalAmount")} </span>
              <span className="font-semibold text-foreground">
                {totalAmount.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                {t("inventory.cancel")}
              </Button>
              <Button variant="secondary" onClick={() => handleSubmit("DRAFT")} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("inventory.saveDraft")}
              </Button>
              <Button onClick={() => handleSubmit("COMPLETED")} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("inventory.saveAndProcess")}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
