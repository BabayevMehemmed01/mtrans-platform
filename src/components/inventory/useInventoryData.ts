"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsSnapshot, ProductLite, StockMovementLite, SupplierLite, WarehouseLite } from "./types";

// =============================================================================
// useInventoryData — WMS modulunun bütün datasını (məhsullar, anbarlar, stok
// hərəkətləri, analitika) yükləyən paylaşılan hook. Heç bir mock data yoxdur —
// hər şey real Prisma/API sorğularından gəlir.
// =============================================================================
export function useInventoryData() {
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLite[]>([]);
  const [movements, setMovements] = useState<StockMovementLite[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierLite[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, warehousesRes, movementsRes, analyticsRes, suppliersRes] = await Promise.all([
        fetch("/api/inventory/products?includeInactive=0&limit=200"),
        fetch("/api/inventory/warehouses"),
        fetch("/api/inventory/movements?limit=200"),
        fetch("/api/inventory/analytics"),
        fetch("/api/inventory/suppliers?includeInactive=1"),
      ]);

      const [productsData, warehousesData, movementsData, analyticsData, suppliersData] = await Promise.all([
        productsRes.json(),
        warehousesRes.json(),
        movementsRes.json(),
        analyticsRes.json(),
        suppliersRes.json(),
      ]);

      if (Array.isArray(productsData)) setProducts(productsData);
      if (Array.isArray(warehousesData)) setWarehouses(warehousesData);
      if (Array.isArray(movementsData)) setMovements(movementsData);
      if (analyticsData && !analyticsData.error) setAnalytics(analyticsData);
      if (Array.isArray(suppliersData)) setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading inventory data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetchMovements = useCallback(async () => {
    const res = await fetch("/api/inventory/movements?limit=200");
    const data = await res.json();
    if (Array.isArray(data)) setMovements(data);
  }, []);

  const refetchAnalytics = useCallback(async () => {
    const res = await fetch("/api/inventory/analytics");
    const data = await res.json();
    if (data && !data.error) setAnalytics(data);
  }, []);

  const refetchSuppliers = useCallback(async () => {
    const res = await fetch("/api/inventory/suppliers?includeInactive=1");
    const data = await res.json();
    if (Array.isArray(data)) setSuppliers(data);
  }, []);

  return {
    products,
    setProducts,
    warehouses,
    setWarehouses,
    movements,
    setMovements,
    suppliers,
    setSuppliers,
    analytics,
    loading,
    refetch: fetchAll,
    refetchMovements,
    refetchAnalytics,
    refetchSuppliers,
  };
}

export type InventoryBoard = ReturnType<typeof useInventoryData>;
