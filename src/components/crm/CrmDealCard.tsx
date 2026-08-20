"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Calendar, GripVertical, Mail, MessageCircle, Phone } from "lucide-react";
import type { CrmDeal } from "./types";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { formatDealDate, isDeadlineOverdue } from "./crmUtils";

interface CrmDealCardProps {
  deal: CrmDeal;
  isDragging?: boolean;
  onClick: () => void;
}

export function CrmDealCard({ deal, isDragging, onClick }: CrmDealCardProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isDeadlineOverdue(deal.deadline);
  const clientName = deal.clientName || (deal.crmContact
    ? `${deal.crmContact.firstName} ${deal.crmContact.lastName ?? ""}`.trim()
    : null);
  const clientCompany = deal.clientCompany || deal.crmCompany?.name || null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white rounded-lg border border-[hsl(var(--border))]",
        "p-3 cursor-pointer select-none",
        "hover:border-[hsl(var(--primary)/0.35)] hover:shadow-md transition-all duration-150",
        (isSortableDragging || isDragging) && "opacity-40 shadow-2xl scale-105"
      )}
      onClick={onClick}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0.5 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded text-[hsl(var(--muted-foreground))]"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3" />
      </div>

      <p className="text-[13px] font-medium leading-snug mb-2 line-clamp-2 pl-3 pr-1 text-[hsl(var(--foreground))]">
        {deal.title}
      </p>

      <div className="pl-3 space-y-0.5">
        <p className="font-bold text-sm text-[hsl(var(--foreground))]">
          {(deal.value ?? 0).toLocaleString()} {deal.currency}
        </p>
        {clientName && (
          <p className="font-bold text-[12px] leading-tight truncate">{clientName}</p>
        )}
        {clientCompany && (
          <p className="font-bold text-[12px] leading-tight truncate text-[hsl(var(--foreground)/0.85)]">{clientCompany}</p>
        )}
        {deal.clientPhone && (
          <p className="font-light text-[11px] text-[hsl(var(--muted-foreground))] truncate">{deal.clientPhone}</p>
        )}
        {deal.clientEmail && (
          <p className="font-light text-[11px] text-[hsl(var(--muted-foreground))] truncate">{deal.clientEmail}</p>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 mt-2.5 pt-2 border-t border-[hsl(var(--border)/0.6)] pl-3">
        <div className="flex items-center gap-1 min-w-0">
          <Calendar className={cn("w-3 h-3 flex-shrink-0", overdue ? "text-red-500" : "text-[hsl(var(--muted-foreground))]")} />
          <span
            className={cn(
              "text-[10px] font-medium truncate",
              overdue ? "text-red-600" : "text-[hsl(var(--muted-foreground))]"
            )}
          >
            {deal.deadline
              ? formatDealDate(deal.deadline, lang)
              : (t("crmCalendar.noDeadline") || "Deadline yoxdur")}
          </span>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <QuickAction icon={Phone} label={t("crmDealCard.call") || "Telefon"} />
          <QuickAction icon={Mail} label={t("crmDealCard.mail") || "Mail"} />
          <QuickAction icon={MessageCircle} label={t("crmDealCard.chat") || "Chat"} />
          {deal.assignee ? (
            <div
              className="ml-1 w-6 h-6 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[10px] text-white font-bold"
              title={deal.assignee.name ?? undefined}
            >
              {deal.assignee.name?.[0]}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label }: { icon: typeof Phone; label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="p-1 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
