"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { az, enUS, ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrmDealDialog } from "./CrmDealDialog";
import { getBitrixStageColor } from "./crmUtils";
import type { CrmBoard } from "./useCrmBoard";
import type { CrmDeal } from "./types";

interface CrmCalendarProps {
  board: CrmBoard;
}

type ViewMode = "month" | "week";

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

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    deal: CrmDeal | null;
    defaultDeadline?: string;
  }>({
    open: false,
    mode: "edit",
    deal: null,
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = viewMode === "week" ? weekStart : startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = viewMode === "week" ? weekEnd : endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const weekDays = [
    t("projectCalendar.weekDays.mon") || "B.e",
    t("projectCalendar.weekDays.tue") || "Ç.a",
    t("projectCalendar.weekDays.wed") || "Çər",
    t("projectCalendar.weekDays.thu") || "C.a",
    t("projectCalendar.weekDays.fri") || "Cüm",
    t("projectCalendar.weekDays.sat") || "Şən",
    t("projectCalendar.weekDays.sun") || "Baz",
  ];

  const dealsByDay = (day: Date) => deals.filter((d) => d.deadline && isSameDay(new Date(d.deadline), day));
  const selectedDayDeals = dealsByDay(selectedDate);

  const nextPeriod = () =>
    setCurrentDate((d) => (viewMode === "week" ? addWeeks(d, 1) : addMonths(d, 1)));
  const prevPeriod = () =>
    setCurrentDate((d) => (viewMode === "week" ? subWeeks(d, 1) : subMonths(d, 1)));
  const today = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const openEdit = (deal: CrmDeal) => setDialogState({ open: true, mode: "edit", deal });
  const openCreate = (day: Date) =>
    setDialogState({
      open: true,
      mode: "create",
      deal: null,
      defaultDeadline: day.toISOString(),
    });

  return (
    <div className="h-full flex flex-col bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded-lg p-1 border border-border">
            <button onClick={prevPeriod} className="p-1.5 rounded-md hover:bg-card hover:shadow-sm transition-all text-muted-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={today} className="px-4 py-1.5 text-sm font-bold text-foreground hover:bg-card hover:shadow-sm transition-all rounded-md">
              {t("projectCalendar.today") || "Bu gün"}
            </button>
            <button onClick={nextPeriod} className="p-1.5 rounded-md hover:bg-card hover:shadow-sm transition-all text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-black text-foreground capitalize tracking-tight">
            {viewMode === "week"
              ? `${format(weekStart, "d MMM", { locale: dateLocale })} – ${format(weekEnd, "d MMM yyyy", { locale: dateLocale })}`
              : format(currentDate, "LLLL yyyy", { locale: dateLocale })}
          </h2>
        </div>
        <div className="flex rounded-lg border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
              viewMode === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("projectCalendar.viewMonth") || "Ay"}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all",
              viewMode === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("projectCalendar.viewWeek") || "Həftə"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5 items-start">
          <Card className="bg-card ring-border/80">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-bold text-foreground">
                {t("projectCalendar.pickerTitle") || "Təqvim"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                month={currentDate}
                onMonthChange={setCurrentDate}
                onSelect={(date) => {
                  if (!date) return;
                  setSelectedDate(date);
                  setCurrentDate(date);
                }}
              />
              <div className="mt-3 space-y-2 px-2 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {format(selectedDate, "d MMMM yyyy", { locale: dateLocale })}
                </p>
                {selectedDayDeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("crmCalendar.noDealsForDay") || "Bu günə əqd yoxdur"}
                  </p>
                ) : (
                  selectedDayDeals.map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => openEdit(deal)}
                      className="w-full text-left px-2.5 py-2 text-[12px] font-semibold rounded-lg border border-primary/20 bg-primary/5 text-primary truncate hover:bg-primary/10"
                    >
                      {deal.title}
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="min-w-0 min-h-[750px] h-full flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-muted/50">
              {weekDays.map((day, i) => (
                <div key={i} className="py-3 text-center text-[12px] font-black text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            <div
              className={cn(
                "flex-1 grid grid-cols-7",
                viewMode === "week" ? "auto-rows-[minmax(280px,1fr)]" : "auto-rows-[minmax(120px,1fr)]"
              )}
            >
              {days.map((day, i) => {
                const dayDeals = dealsByDay(day);

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "group relative p-2 border-r border-b border-border/70 transition-colors hover:bg-muted/50 flex flex-col",
                      !isSameMonth(day, monthStart) && viewMode === "month" && "bg-muted/30 text-muted-foreground opacity-60",
                      isToday(day) && "bg-primary/5",
                      isSameDay(day, selectedDate) && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full", isToday(day) ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground")}>
                        {format(day, "d")}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreate(day);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-primary/10 text-primary transition-all"
                        title={t("crmCalendar.addDeal") || "Bu günə yeni əqd əlavə et"}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                      {dayDeals.map((deal) => (
                        <div
                          key={deal.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(deal);
                          }}
                          className="px-2.5 py-1.5 text-[11px] font-bold rounded-md border cursor-pointer truncate transition-all hover:scale-[1.02] shadow-sm bg-primary/5 text-primary border-primary/20"
                          title={deal.title}
                        >
                          {deal.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <CrmDealDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
        mode={dialogState.mode}
        deal={dialogState.deal}
        defaultDeadline={dialogState.defaultDeadline}
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
