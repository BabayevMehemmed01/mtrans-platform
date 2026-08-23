"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Rocket, Megaphone, Camera, Users2, LayoutTemplate } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import { useMarketingData } from "@/components/marketing/useMarketingData";
import { MarketingStartTab } from "@/components/marketing/MarketingStartTab";
import { MarketingCampaignsTab } from "@/components/marketing/MarketingCampaignsTab";
import { MarketingAdsTab } from "@/components/marketing/MarketingAdsTab";
import { MarketingSegmentsTab } from "@/components/marketing/MarketingSegmentsTab";
import { MarketingTemplatesTab } from "@/components/marketing/MarketingTemplatesTab";
import { CreateCampaignDialog } from "@/components/marketing/CreateCampaignDialog";
import { CreateSegmentSheet } from "@/components/marketing/CreateSegmentSheet";
import type { CampaignType, MarketingConfigClient } from "@/components/marketing/types";

const TAB_TRIGGER_CLASS = cn(
  "rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 shadow-none",
  "data-[state=active]:border-[#2FC6F6] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
  "text-muted-foreground hover:text-foreground"
);

export default function MarketingClient({
  config,
  canManage = true,
}: {
  config: MarketingConfigClient;
  canManage?: boolean;
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState("start");
  const board = useMarketingData();

  const [campaignDialog, setCampaignDialog] = useState<{ open: boolean; type: CampaignType }>({
    open: false,
    type: "EMAIL",
  });
  const [segmentSheetOpen, setSegmentSheetOpen] = useState(false);

  const openCreateCampaign = (type: CampaignType) => setCampaignDialog({ open: true, type });

  return (
    <>
      <Toaster position="top-right" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-center border-b border-border">
          <TabsList className="h-auto w-full justify-center gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger value="start" className={TAB_TRIGGER_CLASS}>
              <Rocket className="mr-1.5 h-3.5 w-3.5" /> {t("marketing.tabStart")}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className={TAB_TRIGGER_CLASS}>
              <Megaphone className="mr-1.5 h-3.5 w-3.5" /> {t("marketing.tabCampaigns")}
            </TabsTrigger>
            <TabsTrigger value="ads" className={TAB_TRIGGER_CLASS}>
              <Camera className="mr-1.5 h-3.5 w-3.5" /> {t("marketing.tabAds")}
            </TabsTrigger>
            <TabsTrigger value="segments" className={TAB_TRIGGER_CLASS}>
              <Users2 className="mr-1.5 h-3.5 w-3.5" /> {t("marketing.tabSegments")}
            </TabsTrigger>
            <TabsTrigger value="templates" className={TAB_TRIGGER_CLASS}>
              <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> {t("marketing.tabTemplates")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="start" className="mt-4 space-y-4">
          <MarketingStartTab
            config={config}
            campaigns={board.campaigns}
            segments={board.segments}
            loading={board.loading}
            onCreateCampaign={canManage ? openCreateCampaign : () => {}}
            onGoToCampaigns={() => setActiveTab("campaigns")}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4 space-y-4">
          <MarketingCampaignsTab
            campaigns={board.campaigns}
            config={config}
            loading={board.loading}
            onOpenCreate={canManage ? openCreateCampaign : () => {}}
            onCampaignUpdated={(c) =>
              board.setCampaigns((prev) => prev.map((x) => (x.id === c.id ? c : x)))
            }
            onCampaignDeleted={(id) => board.setCampaigns((prev) => prev.filter((x) => x.id !== id))}
          />
        </TabsContent>

        <TabsContent value="ads" className="mt-4 space-y-4">
          <MarketingAdsTab
            campaigns={board.campaigns}
            config={config}
            loading={board.loading}
            onOpenCreate={canManage ? () => openCreateCampaign("INSTAGRAM") : () => {}}
            onCampaignDeleted={(id) => board.setCampaigns((prev) => prev.filter((x) => x.id !== id))}
          />
        </TabsContent>

        <TabsContent value="segments" className="mt-4 space-y-4">
          <MarketingSegmentsTab
            segments={board.segments}
            loading={board.loading}
            onOpenCreate={canManage ? () => setSegmentSheetOpen(true) : () => {}}
            onSegmentDeleted={(id) => board.setSegments((prev) => prev.filter((x) => x.id !== id))}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <MarketingTemplatesTab
            templates={board.templates}
            loading={board.loading}
            onCreated={(tpl) => board.setTemplates((prev) => [...prev, tpl])}
            onUpdated={(tpl) => board.setTemplates((prev) => prev.map((x) => (x.id === tpl.id ? tpl : x)))}
            onDeleted={(id) => board.setTemplates((prev) => prev.filter((x) => x.id !== id))}
          />
        </TabsContent>
      </Tabs>

      <CreateCampaignDialog
        open={canManage && campaignDialog.open}
        onOpenChange={(open) => setCampaignDialog((prev) => ({ ...prev, open }))}
        type={campaignDialog.type}
        segments={board.segments}
        templates={board.templates}
        onCreated={(c) => board.setCampaigns((prev) => [c, ...prev])}
      />

      <CreateSegmentSheet
        open={canManage && segmentSheetOpen}
        onOpenChange={setSegmentSheetOpen}
        customers={board.customers}
        onCreated={(s) => board.setSegments((prev) => [s, ...prev])}
      />
    </>
  );
}
