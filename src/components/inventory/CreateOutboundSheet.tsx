"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowUpFromLine, Loader2 } from "lucide-react";
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
import { emptyLine } from "./types";
import type { ProductLite, StockMovementLineDraft, WarehouseLite } from "./types";

// =============================================================================
// CreateOutboundSheet — Müştəriyə göndərmə (OUTBOUND / Sales order) sənədi.
// Anbardan çıxan malları qeydə alır. "Save and Process" ilə InventoryLevel-dən
// dərhal (-) tətbiq olunur (kifayət qədər qalıq yoxdursa server 409 qaytarır).
// =============================================================================

const CURRENCIES = ["AZN", "USD", "EUR", "RUB", "TRY"];

interface CreateOutboundSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductLite[];
  warehouses: WarehouseLite[];
  onProductCreated: (product: ProductLite) => void;
  onWarehouseCreated: (warehouse: WarehouseLite) => void;
  onCreated: () => void;
}

export function CreateOutboundSheet({
  open,
  onOpenChange,
  products,
  warehouses,
  onProductCreated,
  onWarehouseCreated,
  onCreated,
}: CreateOutboundSheetProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [documentName, setDocumentName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [currency, setCurrency] = useState("AZN");
  const [comment, setComment] = useState("");
  const [lines, setLines] = useState<StockMovementLineDraft[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setActiveTab("general");
    setDocumentName("");
    setCustomerName("");
    setCurrency("AZN");
    setComment("");
    setLines([emptyLine()]);
  };

  const totalAmount = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const handleSubmit = async (status: "DRAFT" | "COMPLETED") => {
    const validLines = lines.filter((l) => l.productId && l.warehouseId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Ən azı bir düzgün doldurulmuş məhsul sətri tələb olunur (Product, Warehouse, Quantity)");
      setActiveTab("products");
      return;
    }

    setSaving(true);
    try {
      const combinedComment = [customerName.trim() ? `Müştəri: ${customerName.trim()}` : "", comment.trim()]
        .filter(Boolean)
        .join(" — ");

      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "OUTBOUND",
          status,
          reference: documentName.trim() || undefined,
          comment: combinedComment || undefined,
          currency,
          lines: validLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitCost: l.unitCost,
            unitPrice: l.unitPrice,
            fromWarehouseId: l.warehouseId,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Göndərmə sənədi yaradıla bilmədi");

      toast.success(
        status === "COMPLETED"
          ? `Göndərmə icra olundu, qalıqlar yeniləndi (${data.reference})`
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
            <ArrowUpFromLine className="h-4.5 w-4.5 text-blue-600" /> New Shipment (Sales order)
          </SheetTitle>
          <SheetDescription>
            Müştəriyə göndəriləcək malları qeydə alın — anbar qalığı avtomatik azaldılacaq.
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="out-name">Document Name</Label>
                  <Input
                    id="out-name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Sales order #"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="out-customer">Customer</Label>
                  <Input
                    id="out-customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Müştərinin adı (ixtiyari)"
                  />
                </div>
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

              <div className="space-y-1.5">
                <Label htmlFor="out-comment">Comment</Label>
                <Textarea
                  id="out-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Bu göndərmə ilə bağlı qeyd..."
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
                warehouseLabel="Shipping warehouse"
                quantityLabel="Quantity to ship"
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
              <Button onClick={() => handleSubmit("COMPLETED")} disabled={saving}>
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
