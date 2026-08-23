"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketingCampaignLite, MarketingSegmentLite, MarketingCustomerLite, MarketingTemplateLite } from "./types";

// =============================================================================
// useMarketingData — Marketing modulunun bütün datasını (kampaniyalar,
// seqmentlər, müştərilər) yükləyən paylaşılan hook. Bütün tablar eyni datadan
// istifadə edir ki, biri digərində edilən dəyişikliyi dərhal əks etdirsin.
// =============================================================================
export function useMarketingData() {
  const [campaigns, setCampaigns] = useState<MarketingCampaignLite[]>([]);
  const [segments, setSegments] = useState<MarketingSegmentLite[]>([]);
  const [customers, setCustomers] = useState<MarketingCustomerLite[]>([]);
  const [templates, setTemplates] = useState<MarketingTemplateLite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsRes, segmentsRes, customersRes, templatesRes] = await Promise.all([
        fetch("/api/marketing/campaigns"),
        fetch("/api/marketing/segments"),
        fetch("/api/marketing/customers"),
        fetch("/api/marketing/templates"),
      ]);

      const [campaignsData, segmentsData, customersData, templatesData] = await Promise.all([
        campaignsRes.json(),
        segmentsRes.json(),
        customersRes.json(),
        templatesRes.json(),
      ]);

      if (Array.isArray(campaignsData)) setCampaigns(campaignsData);
      if (Array.isArray(segmentsData)) setSegments(segmentsData);
      if (Array.isArray(customersData)) setCustomers(customersData);
      if (Array.isArray(templatesData)) setTemplates(templatesData);
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
    templates,
    setTemplates,
    loading,
    refetch: fetchAll,
  };
}

export type MarketingBoard = ReturnType<typeof useMarketingData>;
