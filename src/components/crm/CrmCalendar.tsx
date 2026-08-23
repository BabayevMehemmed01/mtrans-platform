"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { az, enUS, ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CrmDealDialog } from "./CrmDealDialog";
import { getBitrixStageColor } from "./crmUtils";
import type { CrmBoard } from "./useCrmBoard";
import type { CrmDeal } from "./types";

interface CrmCalendarProps {
  board: CrmBoard;
}

function localeFor(lang: string) {
  if (lang === "en") return enUS;
  if (lang === "ru") return ru;
  return az;
}

export default function CrmCalendar({ board }: CrmCalendarProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  const dateLocale = localeFor(lang);

  const { stages, setDeals, deals, contacts, companies, setCompanies, members } = board;
  const [cursor, setCursor] = useState(new Date());
  const [dialogState, setDialogState] = useState<{ open: boolean; mode: "create" | "edit"; deal: CrmDeal | null }>({
    open: false,
    mode: "edit",
    deal: null,
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekLabels = [
    t("crmCalendar.weekMon") || "B.e",
    t("crmCalendar.weekTue") || "Ç.a",
    t("crmCalendar.weekWed") || "Ç",
    t("crmCalendar.weekThu") || "C.a",
    t("crmCalendar.weekFri") || "C",
    t("crmCalendar.weekSat") || "Ş",
    t("crmCalendar.weekSun") || "B",
  ];

  const dealsByDay = (day: Date) =>
    deals.filter((d) => d.deadline && isSameDay(new Date(d.deadline), day));

  const openEdit = (deal: CrmDeal) => setDialogState({ open: true, mode: "edit", deal });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">
          {format(cursor, "LLLL yyyy", { locale: dateLocale })}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor((d) => subMonths(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            {t("crmCalendar.today") || "Bu gün"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor((d) => addMonths(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {weekLabels.map((label) => (
            <div key={label} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            const dayDeals = dealsByDay(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] border-b border-r p-1.5 ${inMonth ? "bg-card" : "bg-muted/25"}`}
              >
                <div className="flex justify-end mb-1">
                  <span
                    className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                      today
                        ? "bg-primary text-white font-semibold"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayDeals.slice(0, 3).map((deal) => {
                    const stage = stages.find((s) => s.id === deal.stageId) || deal.stage;
                    const color = stage ? getBitrixStageColor(stage) : "#2FC6F6";
                    return (
                      <button
                        key={deal.id}
                        type="button"
                        onClick={() => openEdit(deal)}
                        className="w-full truncate rounded px-1.5 py-0.5 text-[10px] font-semibold text-white text-left hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: color }}
                        title={`${deal.title} · ${(deal.value ?? 0).toLocaleString()} ${deal.currency}`}
                      >
                        {deal.title}
                      </button>
                    );
                  })}
                  {dayDeals.length > 3 && (
                    <p className="text-[10px] text-muted-foreground px-1">+{dayDeals.length - 3}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CrmDealDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
        mode="edit"
        deal={dialogState.deal}
        stages={stages}
        members={members}
        contacts={contacts}
        companies={companies}
        onCreated={(deal) => setDeals((prev) => [deal, ...prev])}
        onUpdated={(deal) => setDeals((prev) => prev.map((d) => (d.id === deal.id ? deal : d)))}
        onDeleted={(id) => setDeals((prev) => prev.filter((d) => d.id !== id))}
        onCompanyCreated={(c) => setCompanies((prev) => [...prev, c])}
      />
    </div>
  );
}
