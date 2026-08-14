"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import CrmKanban from "@/components/crm/CrmKanban";
import CrmDealsList from "@/components/crm/CrmDealsList";
import CrmContacts from "@/components/crm/CrmContacts";
import { useCrmBoard } from "@/components/crm/useCrmBoard";

export default function CrmClient() {
  const [activeTab, setActiveTab] = useState("deals");
  const [dealsView, setDealsView] = useState<"kanban" | "list">("kanban");
  const board = useCrmBoard();

  return (
    <>
      <Toaster position="top-right" />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="deals">Əqdlər</TabsTrigger>
            <TabsTrigger value="contacts">Əlaqələr & Şirkətlər</TabsTrigger>
          </TabsList>

          {activeTab === "deals" && (
            <div className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] p-1">
              <button
                onClick={() => setDealsView("kanban")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  dealsView === "kanban"
                    ? "bg-[hsl(var(--primary))] text-white"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => setDealsView("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  dealsView === "list"
                    ? "bg-[hsl(var(--primary))] text-white"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                )}
              >
                <TableIcon className="w-3.5 h-3.5" /> Cədvəl
              </button>
            </div>
          )}
        </div>

        <TabsContent value="deals" className="space-y-4 h-full">
          {dealsView === "kanban" ? (
            <CrmKanban board={board} />
          ) : (
            <CrmDealsList board={board} />
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <CrmContacts board={board} />
        </TabsContent>
      </Tabs>
    </>
  );
}
