"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketingCampaignLite, MarketingSegmentLite, MarketingCustomerLite } from "./types";

// =============================================================================
// useMarketingData — Marketing modulunun bütün datasını (kampaniyalar,
// seqmentlər, müştərilər) yükləyən paylaşılan hook. Bütün tablar eyni datadan
// istifadə edir ki, biri digərində edilən dəyişikliyi dərhal əks etdirsin.
// =============================================================================
export function useMarketingData() {
  const [campaigns, setCampaigns] = useState<MarketingCampaignLite[]>([]);
  const [segments, setSegments] = useState<MarketingSegmentLite[]>([]);
  const [customers, setCustomers] = useState<MarketingCustomerLite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsRes, segmentsRes, customersRes] = await Promise.all([
        fetch("/api/marketing/campaigns"),
        fetch("/api/marketing/segments"),
        fetch("/api/marketing/customers"),
      ]);

      const [campaignsData, segmentsData, customersData] = await Promise.all([
        campaignsRes.json(),
        segmentsRes.json(),
        customersRes.json(),
      ]);

      if (Array.isArray(campaignsData)) setCampaigns(campaignsData);
      if (Array.isArray(segmentsData)) setSegments(segmentsData);
      if (Array.isArray(customersData)) setCustomers(customersData);
    } catch (error) {
      console.error("Error loading marketing data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    campaigns,
    setCampaigns,
    segments,
    setSegments,
    customers,
    loading,
    refetch: fetchAll,
  };
}

export type MarketingBoard = ReturnType<typeof useMarketingData>;
