"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { CalendarDays, Headset, LayoutGrid, Table as TableIcon, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import CrmKanban from "@/components/crm/CrmKanban";
import CrmDealsList from "@/components/crm/CrmDealsList";
import CrmCalendar from "@/components/crm/CrmCalendar";
import CrmContactCenter from "@/components/crm/CrmContactCenter";
import CrmContacts from "@/components/crm/CrmContacts";
import { useCrmBoard } from "@/components/crm/useCrmBoard";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";

const TAB_TRIGGER_CLASS = cn(
  "rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 shadow-none",
  "data-[state=active]:border-[#2FC6F6] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
  "text-muted-foreground hover:text-foreground"
);

export default function CrmClient() {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [activeTab, setActiveTab] = useState("kanban");
  const board = useCrmBoard();

  return (
    <>
      <Toaster position="top-right" />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-center border-b border-border">
          <TabsList className="h-auto w-full justify-center gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger value="kanban" className={TAB_TRIGGER_CLASS}>
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> {t("crm.tabKanban") || t("crm.viewKanban") || "Kanban"}
            </TabsTrigger>
            <TabsTrigger value="list" className={TAB_TRIGGER_CLASS}>
              <TableIcon className="w-3.5 h-3.5 mr-1.5" /> {t("crm.tabList") || t("crm.viewList") || "Siyahı"}
            </TabsTrigger>
            <TabsTrigger value="calendar" className={TAB_TRIGGER_CLASS}>
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> {t("crm.tabCalendar") || "Təqvim"}
            </TabsTrigger>
            <TabsTrigger value="contact-center" className={TAB_TRIGGER_CLASS}>
              <Headset className="w-3.5 h-3.5 mr-1.5" /> {t("crm.tabContactCenter") || "Əlaqə Mərkəzi"}
            </TabsTrigger>
            <TabsTrigger value="contacts" className={TAB_TRIGGER_CLASS}>
              <Users className="w-3.5 h-3.5 mr-1.5" /> {t("crm.tabContacts") || "Əlaqələr & Şirkətlər"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="space-y-4 h-full mt-4">
          <CrmKanban board={board} />
        </TabsContent>

        <TabsContent value="list" className="space-y-4 mt-4">
          <CrmDealsList board={board} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 mt-4">
          <CrmCalendar board={board} />
        </TabsContent>

        <TabsContent value="contact-center" className="space-y-4 mt-4">
          <CrmContactCenter />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4 mt-4">
          <CrmContacts board={board} />
        </TabsContent>
      </Tabs>
    </>
  );
}
