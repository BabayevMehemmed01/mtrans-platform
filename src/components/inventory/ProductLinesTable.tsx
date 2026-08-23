"use client";

import toast from "react-hot-toast";
import { Plus, ScanBarcode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useT } from "@/hooks/useT";
import { ProductCombobox } from "./ProductCombobox";
import { WarehouseSelect } from "./WarehouseSelect";
import { emptyLine } from "./types";
import type { ProductLite, StockMovementLineDraft, WarehouseLite } from "./types";

// =============================================================================
// ProductLinesTable — Stok sənədlərinin (Stock Adjustment / Transfer / Write-off)
// "Products" cədvəl paneli. Sütunlar konfiqurasiya oluna bilir ki, eyni,
// yoxlanılmış komponent hər üç sənəd tipi üçün istifadə edilə bilsin.
// =============================================================================

interface ProductLinesTableProps {
  lines: StockMovementLineDraft[];
  onLinesChange: (lines: StockMovementLineDraft[]) => void;
  products: ProductLite[];
  warehouses: WarehouseLite[];
  onProductCreated: (product: ProductLite) => void;
  onWarehouseCreated: (warehouse: WarehouseLite) => void;
  showPrices?: boolean;
  warehouseMode?: "single" | "transfer";
  warehouseLabel?: string;
  quantityLabel?: string;
}

export function ProductLinesTable({
  lines,
  onLinesChange,
  products,
  warehouses,
  onProductCreated,
  onWarehouseCreated,
  showPrices = true,
  warehouseMode = "single",
  warehouseLabel,
  quantityLabel,
}: ProductLinesTableProps) {
  const t = useT();
  const resolvedWarehouseLabel = warehouseLabel ?? t("inventory.warehouse");
  const resolvedQuantityLabel = quantityLabel ?? t("inventory.quantity");

  const updateLine = (key: string, patch: Partial<StockMovementLineDraft>) => {
    onLinesChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    onLinesChange(lines.filter((l) => l.key !== key));
  };

  const addLine = () => {
    onLinesChange([...lines, emptyLine()]);
  };

  const applyProduct = (key: string, product: ProductLite) => {
    updateLine(key, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      unitCost: product.purchasePrice,
      unitPrice: product.salesPrice,
    });
  };

  const handleCreateProduct = async (key: string, name: string) => {
    try {
      const res = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: `SKU-${Date.now().toString(36).toUpperCase()}`, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("inventory.productCreateFailed"));
      onProductCreated(data);
      applyProduct(key, data);
      toast.success(t("inventory.productCreated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("inventory.errorGeneric"));
    }
  };

  const handleBarcodeLookup = async (key: string, barcode: string) => {
    if (!barcode.trim()) return;
    try {
      const res = await fetch(`/api/inventory/products?barcode=${encodeURIComponent(barcode.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || t("inventory.barcodeNotFound"));
        return;
      }
      applyProduct(key, data);
      toast.success(t("inventory.barcodeFound").replace("{name}", data.name));
    } catch {
      toast.error(t("inventory.barcodeError"));
    }
  };

  const total = lines.reduce((sum, l) => sum + (showPrices ? l.unitCost : 0) * l.quantity, 0);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">{t("inventory.product")}</TableHead>
              <TableHead className="min-w-[160px]">{t("inventory.barcode")}</TableHead>
              {showPrices && <TableHead className="w-[120px]">{t("inventory.purchasePrice")}</TableHead>}
              {showPrices && <TableHead className="w-[120px]">{t("inventory.salePrice")}</TableHead>}
              <TableHead className="w-[110px]">{resolvedQuantityLabel}</TableHead>
              {warehouseMode === "single" ? (
                <TableHead className="min-w-[180px]">{resolvedWarehouseLabel}</TableHead>
              ) : (
                <>
                  <TableHead className="min-w-[160px]">{t("inventory.from")}</TableHead>
                  <TableHead className="min-w-[160px]">{t("inventory.to")}</TableHead>
                </>
              )}
              <TableHead className="w-[44px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {t("inventory.noProductLines")}
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => (
                <TableRow key={line.key}>
                  <TableCell>
                    <ProductCombobox
                      products={products}
                      value={line.productId || null}
                      onSelect={(p) => applyProduct(line.key, p)}
                      onCreateNew={(name) => handleCreateProduct(line.key, name)}
                    />
                  </TableCell>
                  <TableCell>
                    <InputGroup className="h-9">
                      <InputGroupAddon>
                        <ScanBarcode className="h-3.5 w-3.5" />
                      </InputGroupAddon>
                      <InputGroupInput
                        placeholder={t("inventory.barcodePlaceholder")}
                        value={line.barcode}
                        onChange={(e) => updateLine(line.key, { barcode: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleBarcodeLookup(line.key, line.barcode);
                          }
                        }}
                      />
                    </InputGroup>
                  </TableCell>
                  {showPrices && (
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-9"
                        value={line.unitCost}
                        onChange={(e) => updateLine(line.key, { unitCost: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                  )}
                  {showPrices && (
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-9"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      className="h-9"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  {warehouseMode === "single" ? (
                    <TableCell>
                      <WarehouseSelect
                        warehouses={warehouses}
                        value={line.warehouseId}
                        onChange={(id) => updateLine(line.key, { warehouseId: id })}
                        onCreated={onWarehouseCreated}
                      />
                    </TableCell>
                  ) : (
                    <>
                      <TableCell>
                        <WarehouseSelect
                          warehouses={warehouses}
                          value={line.fromWarehouseId}
                          onChange={(id) => updateLine(line.key, { fromWarehouseId: id })}
                          onCreated={onWarehouseCreated}
                          placeholder={t("inventory.from")}
                        />
                      </TableCell>
                      <TableCell>
                        <WarehouseSelect
                          warehouses={warehouses}
                          value={line.toWarehouseId}
                          onChange={(id) => updateLine(line.key, { toWarehouseId: id })}
                          onCreated={onWarehouseCreated}
                          placeholder={t("inventory.to")}
                        />
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeLine(line.key)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" size="sm" onClick={addLine} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" /> {t("inventory.addProduct")}
      </Button>

      {showPrices && (
        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3 text-sm">
          <span className="text-muted-foreground">{t("inventory.totalAmount")}</span>
          <span className="text-base font-semibold">{total.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )}
    </div>
  );
}
