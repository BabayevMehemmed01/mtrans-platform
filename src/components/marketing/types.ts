// =============================================================================
// Marketing Module — Shared Client Types
// =============================================================================

export type CampaignType = "EMAIL" | "SMS" | "WHATSAPP" | "INSTAGRAM";
export type CampaignStatus = "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export interface CampaignStats {
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  openRate?: number;
  clickRate?: number;
}

export interface CustomRecipient {
  name?: string;
  email?: string;
  phone?: string;
}

export interface MarketingSegmentLite {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  customerIds: string[];
  customRecipients: CustomRecipient[];
  useCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: { campaigns: number };
}

export interface MarketingCampaignLite {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  subject: string | null;
  content: string | null;
  stats: CampaignStats;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  segmentId: string | null;
  segment?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string; avatar: string | null } | null;
}

export interface MarketingTemplateLite {
  id: string;
  name: string;
  type: CampaignType;
  subject: string | null;
  content: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCustomerLite {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  createdAt: string;
}

export interface MarketingConfigClient {
  isEmailActive: boolean;
  isSmsActive: boolean;
  isWhatsappActive: boolean;
  isInstagramActive: boolean;
}

export function segmentRecipientCount(segment: Pick<MarketingSegmentLite, "customerIds" | "customRecipients">): number {
  const customerCount = segment.customerIds?.length ?? 0;
  const customCount = Array.isArray(segment.customRecipients) ? segment.customRecipients.length : 0;
  return customerCount + customCount;
}
