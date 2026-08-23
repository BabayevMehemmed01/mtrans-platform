"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownToLine, Loader2 } from "lucide-react";
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
import { ProductLinesTable } from "./ProductLinesTable";
import { SupplierSelect } from "./SupplierSelect";
import { emptyLine } from "./types";
import type { ProductLite, StockMovementLineDraft, SupplierLite, WarehouseLite } from "./types";

// =============================================================================
// CreateReceivingSheet — Təchizatçıdan mal qəbulu (INBOUND) sənədi. Bitrix24-ün
// "Goods receipt" sənədinə bənzəyir: təchizatçı seçilir, hədəf anbara (bir və ya
// bir neçə məhsul sətri üçün) qəbul olunan miqdar yazılır. "Save and Process" ilə
// InventoryLevel-ə dərhal (+) tətbiq olunur.
// =============================================================================

const CURRENCIES = ["AZN", "USD", "EUR", "RUB", "TRY"];

interface CreateReceivingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductLite[];
  warehouses: WarehouseLite[];
  suppliers: SupplierLite[];
  onProductCreated: (product: ProductLite) => void;
  onWarehouseCreated: (warehouse: WarehouseLite) => void;
  onSupplierCreated: (supplier: SupplierLite) => void;
  onCreated: () => void;
}

export function CreateReceivingSheet({
  open,
  onOpenChange,
  products,
  warehouses,
  suppliers,
  onProductCreated,
  onWarehouseCreated,
  onSupplierCreated,
  onCreated,
}: CreateReceivingSheetProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [documentName, setDocumentName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [currency, setCurrency] = useState("AZN");
  const [comment, setComment] = useState("");
  const [lines, setLines] = useState<StockMovementLineDraft[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setActiveTab("general");
    setDocumentName("");
    setSupplierId("");
    setCurrency("AZN");
    setComment("");
    setLines([emptyLine()]);
  };

  const totalAmount = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);

  const handleSubmit = async (status: "DRAFT" | "COMPLETED") => {
    const validLines = lines.filter((l) => l.productId && l.warehouseId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Ən azı bir düzgün doldurulmuş məhsul sətri tələb olunur (Product, Warehouse, Quantity)");
      setActiveTab("products");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INBOUND",
          status,
          reference: documentName.trim() || undefined,
          comment: comment.trim() || undefined,
          currency,
          supplierId: supplierId || undefined,
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
      if (!res.ok) throw new Error(data?.error || "Qəbul sənədi yaradıla bilmədi");

      toast.success(
        status === "COMPLETED"
          ? `Mal qəbulu icra olundu, qalıqlar yeniləndi (${data.reference})`
          : `Qaralama yadda saxlanıldı (${data.reference})`
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
            <ArrowDownToLine className="h-4.5 w-4.5 text-emerald-600" /> Goods Receiving
          </SheetTitle>
          <SheetDescription>
            Təchizatçıdan daxil olan malları qəbul edin — anbar qalığı avtomatik artırılacaq.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border/60 px-6">
            <TabsList className="h-auto justify-start gap-1 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="general"
                className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Products {lines.filter((l) => l.productId).length > 0 && `(${lines.filter((l) => l.productId).length})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="general" className="m-0 space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="rcv-name">Document Name</Label>
                <Input
                  id="rcv-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Goods receipt #"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Supplier</Label>
                  <SupplierSelect
                    suppliers={suppliers}
                    value={supplierId}
                    onChange={setSupplierId}
                    onCreated={onSupplierCreated}
                    placeholder="Select supplier..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rcv-comment">Comment</Label>
                <Textarea
                  id="rcv-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Bu qəbul ilə bağlı qeyd (nəqliyyat sənədi, faktura №...)"
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
                warehouseLabel="Receiving warehouse"
                quantityLabel="Quantity received"
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-sm">
              <span className="text-muted-foreground">Total amount: </span>
              <span className="font-semibold text-foreground">
                {totalAmount.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => handleSubmit("DRAFT")} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button onClick={() => handleSubmit("COMPLETED")} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save and Process
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
