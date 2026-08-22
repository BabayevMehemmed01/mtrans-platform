// =============================================================================
// Inventory (WMS) Module — Shared Client Types
// =============================================================================

export type WarehouseType = "MAIN" | "TRANSIT";
export type StockMovementType = "INBOUND" | "OUTBOUND" | "TRANSFER" | "ADJUSTMENT" | "SCRAP";
export type StockMovementStatus = "DRAFT" | "PENDING" | "COMPLETED" | "CANCELLED";

export interface WarehouseBinLite {
  id: string;
  code: string;
}

export interface WarehouseZoneLite {
  id: string;
  name: string;
  code: string | null;
  bins: WarehouseBinLite[];
}

export interface WarehouseLite {
  id: string;
  name: string;
  location: string | null;
  type: WarehouseType;
  isActive: boolean;
  zones: WarehouseZoneLite[];
  totalQuantity: number;
  createdAt: string;
}

export interface ProductLite {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  category: string | null;
  unit: string;
  minStockLimit: number;
  purchasePrice: number;
  salesPrice: number;
  isTrackedByBatch: boolean;
  isActive: boolean;
  totalQuantity: number;
  createdAt: string;
}

export interface StockMovementLite {
  id: string;
  type: StockMovementType;
  status: StockMovementStatus;
  reference: string | null;
  comment: string | null;
  currency: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  totalAmount: number;
  lotNumber: string | null;
  expiryDate: string | null;
  processedAt: string | null;
  createdAt: string;
  productId: string;
  product?: { id: string; name: string; sku: string; unit: string; barcode: string | null } | null;
  fromWarehouseId: string | null;
  fromWarehouse?: { id: string; name: string } | null;
  toWarehouseId: string | null;
  toWarehouse?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string; avatar: string | null } | null;
}

export interface AbcAnalysisRowLite {
  productId: string;
  sku: string;
  name: string;
  value: number;
  percentOfTotal: number;
  cumulativePercent: number;
  category: "A" | "B" | "C";
}

export interface TurnoverRowLite {
  productId: string;
  sku: string;
  name: string;
  outboundQuantity: number;
  averageInventory: number;
  turnoverRatio: number;
}

export interface AnalyticsSnapshot {
  totals: {
    totalProducts: number;
    totalQuantity: number;
    totalValuation: number;
    lowStockCount: number;
    warehouseCount: number;
  };
  abc: AbcAnalysisRowLite[];
  abcSummary: { A: number; B: number; C: number };
  turnover: TurnoverRowLite[];
  periodDays: number;
}

export interface StockMovementLineDraft {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  warehouseId: string; // Single-anbar rejimi (Adjustment / Write-off)
  fromWarehouseId: string; // Transfer rejimi
  toWarehouseId: string; // Transfer rejimi
}

export function emptyLine(): StockMovementLineDraft {
  return {
    key: Math.random().toString(36).slice(2),
    productId: "",
    productName: "",
    sku: "",
    barcode: "",
    unitCost: 0,
    unitPrice: 0,
    quantity: 1,
    warehouseId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
  };
}
