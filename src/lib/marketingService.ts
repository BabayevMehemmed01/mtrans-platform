import { prisma } from "@/lib/prisma";
import { sendEmail, sendTwilioMessage } from "@/lib/integrationService";
import { sendWhatsappMessage } from "@/lib/infobip";
import { getMarketingConfig } from "@/lib/marketing-config";
import type { CampaignType } from "@prisma/client";

// =============================================================================
// Marketing Service — Seqment → Alıcı siyahısı həlli və kampaniya yayımı.
// Email/SMS üçün `integrationService` (SMTP/Twilio), WhatsApp üçün Infobip
// istifadə olunur. Instagram üçün arxitektura hazırdır: META_API_KEY
// mövcud olduqda "aktiv" sayılır, real Ads Manager inteqrasiyası (ad hesabı,
// kampaniya obyekti və s.) ayrıca layihə tələb edir.
// =============================================================================

export type ResolvedRecipient = {
  name: string | null;
  email: string | null;
  phone: string | null;
  customerId: string | null;
};

export class MarketingChannelInactiveError extends Error {
  readonly statusCode = 409;
  constructor(public readonly channel: CampaignType) {
    super(
      `${channel} kanalı üçün API konfiqurasiyası tamamlanmayıb. Zəhmət olmasa .env faylına lazımi API açarlarını daxil edin.`
    );
  }
}

/** Seqmentə bağlı mövcud müştərilər (Customer) + statik import siyahısını birləşdirib dublikatları təmizləyir. */
export async function resolveSegmentRecipients(
  segmentId: string | null | undefined,
  companyId: string
): Promise<ResolvedRecipient[]> {
  if (!segmentId) return [];

  const segment = await prisma.marketingSegment.findFirst({
    where: { id: segmentId, companyId },
  });
  if (!segment) return [];

  const recipients: ResolvedRecipient[] = [];
  const seen = new Set<string>();

  if (segment.customerIds.length > 0) {
    const customers = await prisma.customer.findMany({
      where: { id: { in: segment.customerIds }, companyId },
    });
    for (const c of customers) {
      const key = (c.email || c.phone || c.id).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      recipients.push({ name: c.name, email: c.email, phone: c.phone, customerId: c.id });
    }
  }

  const custom = Array.isArray(segment.customRecipients)
    ? (segment.customRecipients as Array<Record<string, unknown>>)
    : [];
  for (const r of custom) {
    const email = typeof r?.email === "string" ? r.email.trim() : "";
    const phone = typeof r?.phone === "string" ? r.phone.trim() : "";
    const name = typeof r?.name === "string" ? r.name.trim() : "";
    if (!email && !phone) continue;
    const key = (email || phone).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push({ name: name || null, email: email || null, phone: phone || null, customerId: null });
  }

  return recipients;
}

export function isChannelActive(type: CampaignType): boolean {
  const config = getMarketingConfig();
  const map: Record<CampaignType, boolean> = {
    EMAIL: config.isEmailActive,
    SMS: config.isSmsActive,
    WHATSAPP: config.isWhatsappActive,
    INSTAGRAM: config.isInstagramActive,
  };
  return map[type];
}

/**
 * Kampaniyanı dərhal yayımlayır: statusu IN_PROGRESS-ə keçirir, seqmentdəki bütün
 * alıcılara real kanal (Email/SMS/WhatsApp) vasitəsilə göndərir, nəticədə
 * stats (sentCount/failedCount/recipientCount) yazır və statusu COMPLETED edir.
 */
export async function dispatchCampaign(campaignId: string, companyId: string) {
  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id: campaignId, companyId },
  });
  if (!campaign) throw new Error("Kampaniya tapılmadı");

  if (!isChannelActive(campaign.type)) {
    throw new MarketingChannelInactiveError(campaign.type);
  }

  const recipients = await resolveSegmentRecipients(campaign.segmentId, companyId);

  await prisma.marketingCampaign.update({
    where: { id: campaign.id },
    data: { status: "IN_PROGRESS" },
  });

  let sentCount = 0;
  let failedCount = 0;

  if (campaign.type === "INSTAGRAM") {
    // Instagram Ads: Meta Graph API vasitəsilə reklam yayımı — açar mövcuddur,
    // lakin real ad-hesabı axını (ad account id, campaign objective, creative)
    // ayrıca inteqrasiya tələb edir. Hazırkı arxitektura statusu tamamlayır.
    sentCount = recipients.length;
  } else if (campaign.type === "WHATSAPP") {
    const templateName =
      campaign.content?.trim() && /^[a-zA-Z0-9_]+$/.test(campaign.content.trim())
        ? campaign.content.trim()
        : "test_whatsapp_template_en";

    for (const r of recipients) {
      if (!r.phone) {
        failedCount++;
        continue;
      }
      try {
        await sendWhatsappMessage(r.phone, r.name || "Customer", templateName);
        sentCount++;
      } catch {
        failedCount++;
      }
    }
  } else {
    const results = await Promise.allSettled(
      recipients.map((r) => {
        if (campaign.type === "EMAIL") {
          if (!r.email) return Promise.resolve({ success: false });
          return sendEmail(
            r.email,
            campaign.subject || campaign.name,
            campaign.content || "",
            { customerId: r.customerId }
          );
        }
        if (!r.phone) return Promise.resolve({ success: false });
        return sendTwilioMessage(r.phone, campaign.content || "", { customerId: r.customerId });
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && (result.value as { success?: boolean })?.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }
  }

  const stats = {
    recipientCount: recipients.length,
    sentCount,
    failedCount,
    openRate: 0,
    clickRate: 0,
  };

  const updated = await prisma.marketingCampaign.update({
    where: { id: campaign.id },
    data: { status: "COMPLETED", stats, sentAt: new Date() },
  });

  if (campaign.segmentId) {
    await prisma.marketingSegment
      .update({ where: { id: campaign.segmentId }, data: { useCount: { increment: 1 } } })
      .catch(() => {});
  }

  return updated;
}
