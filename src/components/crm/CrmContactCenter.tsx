"use client";

import { Mail, MessageCircle, MessageSquareText, Phone, Send } from "lucide-react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Channel = {
  key: "mail" | "telephony" | "whatsapp" | "telegram" | "sms";
  color: string;
  icon: ReactNode;
};

const CHANNELS: Channel[] = [
  { key: "mail", color: "#EA4335", icon: <Mail className="w-10 h-10" /> },
  { key: "telephony", color: "#2FC6F6", icon: <Phone className="w-10 h-10" /> },
  { key: "whatsapp", color: "#25D366", icon: <MessageCircle className="w-10 h-10" /> },
  { key: "telegram", color: "#229ED9", icon: <Send className="w-10 h-10" /> },
  { key: "sms", color: "#6366F1", icon: <MessageSquareText className="w-10 h-10" /> },
];

export default function CrmContactCenter() {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">{t("crmContactCenter.title") || t("crm.tabContactCenter") || "Əlaqə Mərkəzi"}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("crmContactCenter.subtitle") || ""}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CHANNELS.map((channel) => (
          <button
            key={channel.key}
            type="button"
            className={cn(
              "group aspect-square rounded-2xl border border-border bg-card",
              "flex flex-col items-center justify-center gap-3 p-4",
              "shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150"
            )}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
              style={{ backgroundColor: channel.color }}
            >
              {channel.icon}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{t(`crmContactCenter.${channel.key}`) || channel.key}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("crmContactCenter.comingSoon") || "Tezliklə"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
