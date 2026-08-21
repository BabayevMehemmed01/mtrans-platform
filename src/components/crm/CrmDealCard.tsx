"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Calendar, GripVertical, Mail } from "lucide-react";
import type { CrmDeal } from "./types";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { formatDealDate, getDealEmail, getDealPhone, isDeadlineOverdue, toWhatsAppHref } from "./crmUtils";

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
  const clientEmail = getDealEmail(deal);
  const clientPhone = getDealPhone(deal);

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

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <QuickAction
            icon={Mail}
            label={t("crmDealCard.mail") || "Mail"}
            href={clientEmail ? `mailto:${clientEmail}` : undefined}
          />
          <QuickAction
            icon={WhatsAppIcon}
            label={t("crmDealCard.whatsapp") || t("crmDealCard.call") || "WhatsApp"}
            href={clientPhone ? toWhatsAppHref(clientPhone) ?? undefined : undefined}
            external
          />
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  external?: boolean;
}) {
  // Disabled whenever there is no valid phone/email — greyed out and fully unclickable,
  // so a missing contact detail can never open the deal's edit modal by accident.
  const enabled = Boolean(href);

  return (
    <a
      href={enabled ? href : undefined}
      target={enabled && external ? "_blank" : undefined}
      rel={enabled && external ? "noopener noreferrer" : undefined}
      title={label}
      aria-label={label}
      aria-disabled={!enabled}
      className={cn(
        "p-1 rounded-md transition-colors",
        enabled
          ? "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]"
          : "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      onClick={(e) => {
        // Prevent the click from bubbling up to the card and opening the edit modal.
        e.stopPropagation();
        if (!enabled) e.preventDefault();
      }}
    >
      <Icon className="w-3.5 h-3.5" />
    </a>
  );
}
