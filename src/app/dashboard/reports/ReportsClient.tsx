"use client";

import { useState } from "react";
import { LayoutDashboard, Contact, Megaphone, Boxes } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CustomizeMenu, type CustomizeMenuItem } from "@/components/layout/CustomizeMenu";
import { useCustomization, type VisibilityMap } from "@/hooks/useCustomization";
import { useT } from "@/hooks/useT";
import { ReportsOverviewTab } from "@/components/reports/ReportsOverviewTab";
import { ReportsCrmTab } from "@/components/reports/ReportsCrmTab";
import { ReportsMarketingTab } from "@/components/reports/ReportsMarketingTab";
import { ReportsInventoryTab } from "@/components/reports/ReportsInventoryTab";
import type { ReportsData } from "@/components/reports/types";

const TAB_TRIGGER_CLASS = cn(
  "rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 shadow-none",
  "data-[state=active]:border-[#2FC6F6] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
  "text-muted-foreground hover:text-foreground"
);

const SCOPE = "reports-overview";

export function ReportsClient({
  data,
  initialPreferences,
}: {
  data: ReportsData;
  initialPreferences: VisibilityMap;
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState("overview");
  const { isVisible, setVisible } = useCustomization(SCOPE, initialPreferences);

  const widgetItems: CustomizeMenuItem[] = [
    { key: "statCards", label: t("reportsPage.widgetStatCards") },
    { key: "statusTrend", label: t("reportsPage.widgetStatusTrend") },
    { key: "priorityDept", label: t("reportsPage.widgetPriorityDept") },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border">
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <TabsList className="h-auto w-max justify-start gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger value="overview" className={TAB_TRIGGER_CLASS}>
              <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> {t("reportsPage.tabOverview")}
            </TabsTrigger>
            <TabsTrigger value="crm" className={TAB_TRIGGER_CLASS}>
              <Contact className="mr-1.5 h-3.5 w-3.5" /> {t("reportsPage.tabCrm")}
            </TabsTrigger>
            <TabsTrigger value="marketing" className={TAB_TRIGGER_CLASS}>
              <Megaphone className="mr-1.5 h-3.5 w-3.5" /> {t("reportsPage.tabMarketing")}
            </TabsTrigger>
            <TabsTrigger value="inventory" className={TAB_TRIGGER_CLASS}>
              <Boxes className="mr-1.5 h-3.5 w-3.5" /> {t("reportsPage.tabInventory")}
            </TabsTrigger>
          </TabsList>
        </div>
        {activeTab === "overview" && (
          <CustomizeMenu
            items={widgetItems}
            isVisible={isVisible}
            setVisible={setVisible}
            title={t("reportsPage.customizeWidgets")}
            triggerLabel=""
          />
        )}
      </div>

      <TabsContent value="overview" className="mt-4">
        <ReportsOverviewTab data={data.overview} isVisible={isVisible} />
      </TabsContent>
      <TabsContent value="crm" className="mt-4">
        <ReportsCrmTab data={data.crm} />
      </TabsContent>
      <TabsContent value="marketing" className="mt-4">
        <ReportsMarketingTab data={data.marketing} />
      </TabsContent>
      <TabsContent value="inventory" className="mt-4">
        <ReportsInventoryTab data={data.inventory} />
      </TabsContent>
    </Tabs>
  );
}
