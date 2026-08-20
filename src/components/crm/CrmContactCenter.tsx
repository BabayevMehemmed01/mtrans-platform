"use client";

import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Channel = {
  key: "mail" | "telephony" | "whatsapp" | "liveChat" | "telegram" | "facebook";
  color: string;
  icon: ReactNode;
};

const CHANNELS: Channel[] = [
  { key: "mail", color: "#EA4335", icon: <Mail className="w-10 h-10" /> },
  { key: "telephony", color: "#2FC6F6", icon: <Phone className="w-10 h-10" /> },
  { key: "whatsapp", color: "#25D366", icon: <MessageCircle className="w-10 h-10" /> },
  { key: "liveChat", color: "#00AEEF", icon: <MessageCircle className="w-10 h-10" /> },
  { key: "telegram", color: "#229ED9", icon: <Send className="w-10 h-10" /> },
  { key: "facebook", color: "#1877F2", icon: <FacebookGlyph /> },
];

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current" aria-hidden>
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.75 8.44-4.91 8.44-9.93Z" />
    </svg>
  );
}

export default function CrmContactCenter() {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">{t("crmContactCenter.title") || t("crm.tabContactCenter") || "Əlaqə Mərkəzi"}</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          {t("crmContactCenter.subtitle") || ""}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CHANNELS.map((channel) => (
          <button
            key={channel.key}
            type="button"
            className={cn(
              "group aspect-square rounded-2xl border border-[hsl(var(--border))] bg-white",
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
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                {t("crmContactCenter.comingSoon") || "Tezliklə"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
