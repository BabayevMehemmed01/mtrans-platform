"use client";

import { useMemo, useState } from "react";
import { ClipboardEdit, PackagePlus, Search, UploadCloud, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { InventoryTableSkeleton } from "./InventoryEmptyState";
import { MigrateDataDialog } from "./MigrateDataDialog";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { ProductLite } from "./types";

// =============================================================================
// InventoryOverviewTab — Əsas "Inventory" tab-ı. Heç bir sənəd/məhsul yoxdursa,
// Bitrix24-ə uyğun boş-ekran (empty state) göstərir: "Create your first stock
// adjustment" + "Migrate" məlumat blokları. Məlumat mövcud olduqda real-time
// qalıq cədvəli göstərilir.
// =============================================================================

interface InventoryOverviewTabProps {
  products: ProductLite[];
  loading: boolean;
  hasAnyDocument: boolean;
  onOpenAdjustment: () => void;
}

export function InventoryOverviewTab({ products, loading, hasAnyDocument, onOpenAdjustment }: InventoryOverviewTabProps) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [migrateOpen, setMigrateOpen] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        search
          ? p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode || "").toLowerCase().includes(search.toLowerCase())
          : true
      ),
    [products, search]
  );

  const isEmpty = !loading && products.length === 0 && !hasAnyDocument;

  if (loading) {
    return (
      <div className="rounded-2xl shadow-sm">
        <InventoryTableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6 px-4 py-12">
        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <button
            onClick={onOpenAdjustment}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardEdit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("inventory.firstAdjustment")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("inventory.firstAdjustmentDesc")}
              </p>
            </div>
            <span className="mt-1 text-xs font-medium text-primary group-hover:underline">{t("inventory.startNow")}</span>
          </button>

          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-foreground/10">
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("inventory.migrateTitle")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("inventory.migrateDesc")}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setMigrateOpen(true)} className="mt-1">
              {t("inventory.migrateTitle")}
            </Button>
          </div>
        </div>

        <MigrateDataDialog open={migrateOpen} onOpenChange={setMigrateOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("inventory.searchProductHint")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMigrateOpen(true)} className="gap-1.5">
            <UploadCloud className="h-4 w-4" /> {t("inventory.migrateTitle")}
          </Button>
          <Button onClick={onOpenAdjustment} className="gap-1.5">
            <PackagePlus className="h-4 w-4" /> {t("inventory.stockAdjustment")}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inventory.product")}</TableHead>
              <TableHead>{t("inventory.sku")}</TableHead>
              <TableHead>{t("inventory.category")}</TableHead>
              <TableHead>{t("inventory.totalQuantity")}</TableHead>
              <TableHead>{t("inventory.minStock")}</TableHead>
              <TableHead>{t("inventory.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {t("inventory.noProduct")}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const low = p.minStockLimit > 0 && p.totalQuantity < p.minStockLimit;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <Warehouse className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          {p.barcode && <p className="truncate text-xs text-muted-foreground">{p.barcode}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.sku}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.category || "—"}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {p.totalQuantity} {p.unit}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.minStockLimit}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-2.5 py-1 font-medium",
                          low ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-600"
                        )}
                      >
                        {low ? t("inventory.lowStock") : t("inventory.inStock")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <MigrateDataDialog open={migrateOpen} onOpenChange={setMigrateOpen} />
    </div>
  );
}
