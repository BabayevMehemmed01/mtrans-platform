"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsSnapshot, ProductLite, StockMovementLite, WarehouseLite } from "./types";

// =============================================================================
// useInventoryData — WMS modulunun bütün datasını (məhsullar, anbarlar, stok
// hərəkətləri, analitika) yükləyən paylaşılan hook. Heç bir mock data yoxdur —
// hər şey real Prisma/API sorğularından gəlir.
// =============================================================================
export function useInventoryData() {
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLite[]>([]);
  const [movements, setMovements] = useState<StockMovementLite[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, warehousesRes, movementsRes, analyticsRes] = await Promise.all([
        fetch("/api/inventory/products?includeInactive=0&limit=200"),
        fetch("/api/inventory/warehouses"),
        fetch("/api/inventory/movements?limit=200"),
        fetch("/api/inventory/analytics"),
      ]);

      const [productsData, warehousesData, movementsData, analyticsData] = await Promise.all([
        productsRes.json(),
        warehousesRes.json(),
        movementsRes.json(),
        analyticsRes.json(),
      ]);

      if (Array.isArray(productsData)) setProducts(productsData);
      if (Array.isArray(warehousesData)) setWarehouses(warehousesData);
      if (Array.isArray(movementsData)) setMovements(movementsData);
      if (analyticsData && !analyticsData.error) setAnalytics(analyticsData);
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

  return {
    products,
    setProducts,
    warehouses,
    setWarehouses,
    movements,
    setMovements,
    analytics,
    loading,
    refetch: fetchAll,
    refetchMovements,
    refetchAnalytics,
  };
}

export type InventoryBoard = ReturnType<typeof useInventoryData>;
