// =============================================================================
// Marketing Config — .env-dəki API açarlarına əsasən kanalların dinamik
// aktivlik vəziyyətini müəyyən edir. Server-only: UI-a yalnız hesablanmış
// boolean/obyekt nəticələr ötürülür, açarların özü heç vaxt client-ə düşmür.
// =============================================================================

export type MarketingChannelKey = "EMAIL" | "SMS" | "WHATSAPP" | "INSTAGRAM";

export interface MarketingChannelState {
  key: MarketingChannelKey;
  active: boolean;
  /** UI-da "Quraşdırma Tələb Olunur" mesajında göstərilən açar adı */
  envHint: string;
}

export interface MarketingConfig {
  isEmailActive: boolean;
  isSmsActive: boolean;
  isWhatsappActive: boolean;
  isInstagramActive: boolean;
  channels: Record<MarketingChannelKey, MarketingChannelState>;
}

/**
 * Server tərəfindən kanal aktivliyini hesablayır:
 * - Email: sistemdə artıq SMTP/Resend inteqrasiyası olduğu üçün default aktivdir.
 * - WhatsApp: INFOBIP_API_KEY təyin olunubsa aktivdir.
 * - SMS: TWILIO_SMS_NUMBER / TWILIO_SMS_FROM mühit dəyişənləri təyin olunubsa aktivdir.
 * - Instagram: META_API_KEY təyin olunubsa aktivdir.
 */
export function getMarketingConfig(): MarketingConfig {
  const isEmailActive = true;
  const isWhatsappActive = !!process.env.INFOBIP_API_KEY;
  const isSmsActive = Boolean(
    process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_SMS_FROM
  );
  const isInstagramActive = Boolean(process.env.META_API_KEY);

  return {
    isEmailActive,
    isSmsActive,
    isWhatsappActive,
    isInstagramActive,
    channels: {
      EMAIL: { key: "EMAIL", active: isEmailActive, envHint: "SMTP_USER / SMTP_PASS" },
      SMS: { key: "SMS", active: isSmsActive, envHint: "TWILIO_SMS_NUMBER" },
      WHATSAPP: { key: "WHATSAPP", active: isWhatsappActive, envHint: "INFOBIP_API_KEY" },
      INSTAGRAM: { key: "INSTAGRAM", active: isInstagramActive, envHint: "META_API_KEY" },
    },
  };
}
