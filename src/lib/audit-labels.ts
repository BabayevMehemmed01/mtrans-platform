import type { AuditAction, EntityType } from "@prisma/client";

// =============================================================================
// Audit Log → İnsan-oxunaqlı Azərbaycanca cümlə
// "{user.name} {action-verb} {entityType-noun} "{entityName}"" formatına uyğun
// AuditAction x EntityType cütlərini təbii ifadələrə çevirir.
// =============================================================================

const ENTITY_NOUN: Record<EntityType, string> = {
  USER: "istifadəçini",
  COMPANY: "şirkəti",
  DEPARTMENT: "departamenti",
  ROLE: "rolu",
  PROJECT: "layihəni",
  TASK: "tapşırığı",
  COMMENT: "şərhi",
  ATTACHMENT: "faylı",
  LABEL: "etiketi",
  MARKETING_CAMPAIGN: "marketinq kampaniyasını",
  MARKETING_SEGMENT: "auditoriya seqmentini",
  WAREHOUSE: "anbarı",
  PRODUCT: "məhsulu",
  STOCK_MOVEMENT: "stok hərəkətini",
  SUPPLIER: "təchizatçını",
  PURCHASE_ORDER: "satınalma sifarişini",
  TEMPLATE: "şablonu",
};

const ENTITY_NOUN_GENERIC: Record<EntityType, string> = {
  USER: "istifadəçi",
  COMPANY: "şirkət",
  DEPARTMENT: "departament",
  ROLE: "rol",
  PROJECT: "layihə",
  TASK: "tapşırıq",
  COMMENT: "şərh",
  ATTACHMENT: "fayl",
  LABEL: "etiket",
  MARKETING_CAMPAIGN: "marketinq kampaniyası",
  MARKETING_SEGMENT: "auditoriya seqmenti",
  WAREHOUSE: "anbar",
  PRODUCT: "məhsul",
  STOCK_MOVEMENT: "stok hərəkəti",
  SUPPLIER: "təchizatçı",
  PURCHASE_ORDER: "satınalma sifarişi",
  TEMPLATE: "şablon",
};

// Xüsusi action+entityType kombinasiyaları üçün fel ifadələri.
// Funksiya `(entityName) => phrase` şəklindədir ki, ad cümləyə düzgün yerləşdirilsin.
type PhraseFn = (entityName: string | null) => string;

const SPECIAL: Partial<Record<AuditAction, Partial<Record<EntityType, PhraseFn>>>> = {
  CREATE: {
    TASK: (n) => `yeni tapşırıq yaratdı${quoted(n)}`,
    PROJECT: (n) => `yeni layihə yaratdı${quoted(n)}`,
    COMMENT: () => `şərh yazdı`,
    LABEL: (n) => `yeni etiket yaratdı${quoted(n)}`,
    DEPARTMENT: (n) => `yeni departament yaratdı${quoted(n)}`,
    ROLE: (n) => `yeni rol yaratdı${quoted(n)}`,
    ATTACHMENT: (n) => `fayl əlavə etdi${quoted(n)}`,
    USER: (n) => `yeni istifadəçi yaratdı${quoted(n)}`,
    MARKETING_CAMPAIGN: (n) => `yeni marketinq kampaniyası yaratdı${quoted(n)}`,
    MARKETING_SEGMENT: (n) => `yeni auditoriya seqmenti yaratdı${quoted(n)}`,
    WAREHOUSE: (n) => `yeni anbar yaratdı${quoted(n)}`,
    PRODUCT: (n) => `yeni məhsul yaratdı${quoted(n)}`,
    STOCK_MOVEMENT: (n) => `yeni stok hərəkəti sənədi yaratdı${quoted(n)}`,
    SUPPLIER: (n) => `yeni təchizatçı yaratdı${quoted(n)}`,
    PURCHASE_ORDER: (n) => `yeni satınalma sifarişi yaratdı${quoted(n)}`,
    TEMPLATE: (n) => `yeni şablon yaratdı${quoted(n)}`,
  },
  UPDATE: {
    TASK: (n) => `tapşırığı yenilədi${quoted(n)}`,
    PROJECT: (n) => `layihəni yenilədi${quoted(n)}`,
    USER: (n) => `istifadəçi məlumatlarını yenilədi${quoted(n)}`,
    ROLE: (n) => `rolu yenilədi${quoted(n)}`,
    DEPARTMENT: (n) => `departamenti yenilədi${quoted(n)}`,
    LABEL: (n) => `etiketi yenilədi${quoted(n)}`,
    COMMENT: () => `şərhi redaktə etdi`,
    COMPANY: () => `şirkət məlumatlarını yenilədi`,
    MARKETING_CAMPAIGN: (n) => `marketinq kampaniyasını yenilədi${quoted(n)}`,
    MARKETING_SEGMENT: (n) => `auditoriya seqmentini yenilədi${quoted(n)}`,
    WAREHOUSE: (n) => `anbarı yenilədi${quoted(n)}`,
    PRODUCT: (n) => `məhsulu yenilədi${quoted(n)}`,
    STOCK_MOVEMENT: (n) => `stok hərəkəti sənədini yenilədi${quoted(n)}`,
    SUPPLIER: (n) => `təchizatçı məlumatlarını yenilədi${quoted(n)}`,
    PURCHASE_ORDER: (n) => `satınalma sifarişini yenilədi${quoted(n)}`,
    TEMPLATE: (n) => `şablonu yenilədi${quoted(n)}`,
  },
  DELETE: {
    TASK: (n) => `tapşırığı sildi${quoted(n)}`,
    PROJECT: (n) => `layihəni sildi${quoted(n)}`,
    COMMENT: () => `şərhi sildi`,
    LABEL: (n) => `etiketi sildi${quoted(n)}`,
    ATTACHMENT: (n) => `faylı sildi${quoted(n)}`,
    USER: (n) => `istifadəçini sildi${quoted(n)}`,
    DEPARTMENT: (n) => `departamenti sildi${quoted(n)}`,
    ROLE: (n) => `rolu sildi${quoted(n)}`,
    MARKETING_CAMPAIGN: (n) => `marketinq kampaniyasını sildi${quoted(n)}`,
    MARKETING_SEGMENT: (n) => `auditoriya seqmentini sildi${quoted(n)}`,
    WAREHOUSE: (n) => `anbarı sildi${quoted(n)}`,
    PRODUCT: (n) => `məhsulu sildi${quoted(n)}`,
    STOCK_MOVEMENT: (n) => `stok hərəkəti sənədini sildi${quoted(n)}`,
    SUPPLIER: (n) => `təchizatçını sildi${quoted(n)}`,
    TEMPLATE: (n) => `şablonu sildi${quoted(n)}`,
  },
  LOGIN: {
    USER: () => `sistemə daxil oldu`,
  },
  LOGOUT: {
    USER: () => `sistemdən çıxış etdi`,
  },
  INVITE: {
    USER: (n) => `istifadəçi dəvət etdi${quoted(n)}`,
  },
  ASSIGN: {
    TASK: (n) => `tapşırıq təyin etdi${quoted(n)}`,
    ROLE: (n) => `rol təyin etdi${quoted(n)}`,
    USER: (n) => `istifadəçi təyin etdi${quoted(n)}`,
  },
  COMPLETE: {
    TASK: (n) => `tapşırığı tamamladı${quoted(n)}`,
    PROJECT: (n) => `layihəni tamamladı${quoted(n)}`,
  },
  ARCHIVE: {
    PROJECT: (n) => `layihəni arxivləşdirdi${quoted(n)}`,
    TASK: (n) => `tapşırığı arxivləşdirdi${quoted(n)}`,
  },
  RESTORE: {
    PROJECT: (n) => `layihəni bərpa etdi${quoted(n)}`,
    TASK: (n) => `tapşırığı bərpa etdi${quoted(n)}`,
    USER: (n) => `istifadəçini bərpa etdi${quoted(n)}`,
  },
};

const ACTION_VERB_GENERIC: Record<AuditAction, string> = {
  CREATE: "yaratma",
  UPDATE: "yeniləmə",
  DELETE: "silmə",
  LOGIN: "giriş",
  LOGOUT: "çıxış",
  INVITE: "dəvət",
  ASSIGN: "təyinat",
  COMPLETE: "tamamlama",
  ARCHIVE: "arxivləşdirmə",
  RESTORE: "bərpa",
};

function quoted(name: string | null) {
  return name ? ` "${name}"` : "";
}

/**
 * AuditLog qeydini insan-oxunaqlı Azərbaycanca fəaliyyət cümləsinə çevirir.
 * Nümunə: "Elvin Məmmədov tapşırığı tamamladı "Sayt dizaynı""
 */
export function describeAuditLog(log: {
  action: AuditAction;
  entityType: EntityType;
  entityName?: string | null;
}): string {
  const phraseFn = SPECIAL[log.action]?.[log.entityType];
  if (phraseFn) return phraseFn(log.entityName ?? null);

  // Fallback: "{entityType} üzərində {action} əməliyyatı etdi"
  return `${ENTITY_NOUN_GENERIC[log.entityType]} üzərində ${ACTION_VERB_GENERIC[log.action]} əməliyyatı etdi${quoted(log.entityName ?? null)}`;
}
