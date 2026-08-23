import { Mail, MessageSquareText, MessageCircle, Camera, type LucideIcon } from "lucide-react";
import type { CampaignType } from "./types";

export interface ChannelMeta {
  key: CampaignType;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  softBg: string;
  solidBg: string;
  ring: string;
  envHint: string;
}

export const CHANNEL_META: Record<CampaignType, ChannelMeta> = {
  EMAIL: {
    key: "EMAIL",
    label: "Email kampaniyası",
    shortLabel: "Email",
    description: "SMTP / Resend vasitəsilə kütləvi email göndərişi",
    icon: Mail,
    accent: "text-blue-600",
    softBg: "bg-blue-50",
    solidBg: "bg-blue-600",
    ring: "ring-blue-100",
    envHint: "SMTP_USER, SMTP_PASS",
  },
  SMS: {
    key: "SMS",
    label: "SMS kampaniyası",
    shortLabel: "SMS",
    description: "Twilio vasitəsilə qısa mesaj (SMS) kampaniyası",
    icon: MessageSquareText,
    accent: "text-amber-600",
    softBg: "bg-amber-50",
    solidBg: "bg-amber-500",
    ring: "ring-amber-100",
    envHint: "TWILIO_SMS_NUMBER",
  },
  WHATSAPP: {
    key: "WHATSAPP",
    label: "WhatsApp / Mesajlaşma",
    shortLabel: "WhatsApp",
    description: "Twilio WhatsApp Business API ilə mesajlaşma kampaniyası",
    icon: MessageCircle,
    accent: "text-emerald-600",
    softBg: "bg-emerald-50",
    solidBg: "bg-emerald-600",
    ring: "ring-emerald-100",
    envHint: "TWILIO_WHATSAPP_NUMBER",
  },
  INSTAGRAM: {
    key: "INSTAGRAM",
    label: "Instagram reklamları",
    shortLabel: "Instagram",
    description: "Meta Graph API ilə Instagram reklam kampaniyası",
    icon: Camera,
    accent: "text-pink-600",
    softBg: "bg-pink-50",
    solidBg: "bg-pink-600",
    ring: "ring-pink-100",
    envHint: "META_API_KEY",
  },
};

export const CHANNEL_ORDER: CampaignType[] = ["EMAIL", "SMS", "WHATSAPP", "INSTAGRAM"];

export function isChannelActiveFor(type: CampaignType, config: {
  isEmailActive: boolean;
  isSmsActive: boolean;
  isWhatsappActive: boolean;
  isInstagramActive: boolean;
}): boolean {
  switch (type) {
    case "EMAIL":
      return config.isEmailActive;
    case "SMS":
      return config.isSmsActive;
    case "WHATSAPP":
      return config.isWhatsappActive;
    case "INSTAGRAM":
      return config.isInstagramActive;
    default:
      return false;
  }
}
