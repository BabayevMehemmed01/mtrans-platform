"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Boxes, ShoppingCart, ArrowLeftRight, ArrowDownToLine, Trash2, BarChart3, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import { useInventoryData } from "@/components/inventory/useInventoryData";
import { InventoryOverviewTab } from "@/components/inventory/InventoryOverviewTab";
import { ReceivingTab } from "@/components/inventory/ReceivingTab";
import { SalesOrdersTab } from "@/components/inventory/SalesOrdersTab";
import { TransfersTab } from "@/components/inventory/TransfersTab";
import { WriteOffsTab } from "@/components/inventory/WriteOffsTab";
import { SuppliersTab } from "@/components/inventory/SuppliersTab";
import { AnalyticsTab } from "@/components/inventory/AnalyticsTab";
import { StockAdjustmentSheet } from "@/components/inventory/StockAdjustmentSheet";
import { CreateReceivingSheet } from "@/components/inventory/CreateReceivingSheet";
import { CreateOutboundSheet } from "@/components/inventory/CreateOutboundSheet";
import { CreateTransferSheet } from "@/components/inventory/CreateTransferSheet";
import { CreateWriteOffSheet } from "@/components/inventory/CreateWriteOffSheet";

// =============================================================================
// InventoryClient — WMS Dashboard. Bitrix24 üslubunda üst naviqasiya:
// Inventory | Receiving | Sales orders | Transfers | Write-offs | Suppliers | Analytics.
// =============================================================================

const TAB_TRIGGER_CLASS = cn(
  "rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 shadow-none",
  "data-[state=active]:border-[#2FC6F6] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
  "text-muted-foreground hover:text-foreground"
);

export default function InventoryClient({ canManage = true }: { canManage?: boolean }) {
  const t = useT();
  const [activeTab, setActiveTab] = useState("inventory");
  const board = useInventoryData();

  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [receivingOpen, setReceivingOpen] = useState(false);
  const [outboundOpen, setOutboundOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);

  const handleDocumentCreated = () => {
    board.refetch();
  };

  return (
    <>
      <Toaster position="top-right" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-center overflow-x-auto scrollbar-hide border-b border-border">
          <TabsList className="h-auto w-full min-w-max justify-center gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger value="inventory" className={TAB_TRIGGER_CLASS}>
              <Boxes className="mr-1.5 h-3.5 w-3.5" /> {t("inventory.tabInventory")}
            </TabsTrigger>
            <TabsTrigger value="receiving" className={TAB_TRIGGER_CLASS}>
              <ArrowDownToLine className="mr-1.5 h-3.5 w-3.5" /> {t("inventory.tabReceiving")}
            </TabsTrigger>
            <TabsTrigger value="sales-orders" className={TAB_TRIGGER_CLASS}>
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> {t("inventory.tabSalesOrders")}
            </TabsTrigger>
            <TabsTrigger value="transfers" className={TAB_TRIGGER_CLASS}>
              <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" /> {t("inventory.tabTransfers")}
            </TabsTrigger>
            <TabsTrigger value="write-offs" className={TAB_TRIGGER_CLASS}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {t("inventory.tabWriteOffs")}
            </TabsTrigger>
            <TabsTrigger value="suppliers" className={TAB_TRIGGER_CLASS}>
              <Truck className="mr-1.5 h-3.5 w-3.5" /> {t("inventory.tabSuppliers")}
            </TabsTrigger>
            <TabsTrigger value="analytics" className={TAB_TRIGGER_CLASS}>
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> {t("inventory.tabAnalytics")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          <InventoryOverviewTab
            products={board.products}
            loading={board.loading}
            hasAnyDocument={board.movements.length > 0}
            onOpenAdjustment={() => canManage && setAdjustmentOpen(true)}
          />
        </TabsContent>

        <TabsContent value="receiving" className="mt-4 space-y-4">
          <ReceivingTab
            movements={board.movements}
            loading={board.loading}
            onOpenCreate={() => canManage && setReceivingOpen(true)}
            onChanged={() => {
              board.refetchMovements();
              board.refetchAnalytics();
            }}
          />
        </TabsContent>

        <TabsContent value="sales-orders" className="mt-4 space-y-4">
          <SalesOrdersTab
            movements={board.movements}
            loading={board.loading}
            onOpenCreate={() => canManage && setOutboundOpen(true)}
            onChanged={() => {
              board.refetchMovements();
              board.refetchAnalytics();
            }}
          />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4 space-y-4">
          <TransfersTab
            movements={board.movements}
            loading={board.loading}
            onOpenCreate={() => canManage && setTransferOpen(true)}
            onChanged={() => {
              board.refetchMovements();
              board.refetchAnalytics();
            }}
          />
        </TabsContent>

        <TabsContent value="write-offs" className="mt-4 space-y-4">
          <WriteOffsTab
            movements={board.movements}
            loading={board.loading}
            onOpenCreate={() => canManage && setWriteOffOpen(true)}
            onChanged={() => {
              board.refetchMovements();
              board.refetchAnalytics();
            }}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4 space-y-4">
          <SuppliersTab
            suppliers={board.suppliers}
            loading={board.loading}
            onCreated={(s) => board.setSuppliers((prev) => [...prev, s])}
            onUpdated={(s) => board.setSuppliers((prev) => prev.map((x) => (x.id === s.id ? s : x)))}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab analytics={board.analytics} loading={board.loading} />
        </TabsContent>
      </Tabs>

      {canManage && (
        <>
      <StockAdjustmentSheet
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        products={board.products}
        warehouses={board.warehouses}
        onProductCreated={(p) => board.setProducts((prev) => [p, ...prev])}
        onWarehouseCreated={(w) => board.setWarehouses((prev) => [w, ...prev])}
        onCreated={handleDocumentCreated}
      />

      <CreateReceivingSheet
        open={receivingOpen}
        onOpenChange={setReceivingOpen}
        products={board.products}
        warehouses={board.warehouses}
        suppliers={board.suppliers}
        onProductCreated={(p) => board.setProducts((prev) => [p, ...prev])}
        onWarehouseCreated={(w) => board.setWarehouses((prev) => [w, ...prev])}
        onSupplierCreated={(s) => board.setSuppliers((prev) => [...prev, s])}
        onCreated={handleDocumentCreated}
      />

      <CreateOutboundSheet
        open={outboundOpen}
        onOpenChange={setOutboundOpen}
        products={board.products}
        warehouses={board.warehouses}
        onProductCreated={(p) => board.setProducts((prev) => [p, ...prev])}
        onWarehouseCreated={(w) => board.setWarehouses((prev) => [w, ...prev])}
        onCreated={handleDocumentCreated}
      />

      <CreateTransferSheet
        open={transferOpen}
        onOpenChange={setTransferOpen}
        products={board.products}
        warehouses={board.warehouses}
        onProductCreated={(p) => board.setProducts((prev) => [p, ...prev])}
        onWarehouseCreated={(w) => board.setWarehouses((prev) => [w, ...prev])}
        onCreated={handleDocumentCreated}
      />

      <CreateWriteOffSheet
        open={writeOffOpen}
        onOpenChange={setWriteOffOpen}
        products={board.products}
        warehouses={board.warehouses}
        onProductCreated={(p) => board.setProducts((prev) => [p, ...prev])}
        onWarehouseCreated={(w) => board.setWarehouses((prev) => [w, ...prev])}
        onCreated={handleDocumentCreated}
      />
        </>
      )}
    </>
  );
}
