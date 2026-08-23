import { prisma } from "@/lib/prisma";
import type { TemplateType, PermissionKey, CampaignType, Prisma } from "@prisma/client";

// =============================================================================
// Şablon (Template) sistemi — Master/Clone məntiqi
// =============================================================================
// FLSƏFƏ: Hər Template sətri "Master" məlumatdır. Yeni element (layihə, dəvət,
// rol) yaradılarkən bu modulun `cloneTemplateData()` funksiyası ilə `data`
// JSON-u DƏRIN SURƏTLƏNIR və yeni elementin öz sahələrinə köçürülür.
// Yeni elementlə Template arasında HEÇ BİR DB əlaqəsi (foreign key) saxlanmır —
// buna görə yeni elementin sonrakı redaktəsi (və ya silinməsi) Master şablonu
// FİZİKİ OLARAQ ZƏDƏLƏYƏ BİLMƏZ. Şablonun özü isə (isSystem olsa belə) sərbəst
// redaktə oluna bilər — yalnız SİLİNMƏSİ `isSystem=true` olduqda qadağandır ki,
// şirkətdə həmişə ən azı bir başlanğıc dəst qalsın.
// =============================================================================

/** Səthi deep-clone — Prisma JsonValue-lar üçün təhlükəsiz və universal. */
export function cloneTemplateData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(JSON.stringify(data));
}

type DefaultTemplateSeed = {
  name: string;
  description: string;
  data: Record<string, unknown>;
};

// --- Layihə şablonları ---
const DEFAULT_PROJECT_TEMPLATES: DefaultTemplateSeed[] = [
  {
    name: "Standart Layihə",
    description: "Ümumi məqsədli, sadə iş axını olan layihə başlanğıcı",
    data: { status: "PLANNING", priority: "MEDIUM", color: "#6366f1" },
  },
  {
    name: "Proqram Təminatı İnkişafı",
    description: "Sprint əsaslı inkişaf işləri üçün yüksək prioritetli şablon",
    data: { status: "ACTIVE", priority: "HIGH", color: "#06b6d4" },
  },
  {
    name: "Marketinq Kampaniyası",
    description: "Məhdud müddətli marketinq təşəbbüsləri üçün",
    data: { status: "PLANNING", priority: "HIGH", color: "#ec4899" },
  },
  {
    name: "Daxili Təşkilati İş",
    description: "Aşağı prioritetli daxili proseslər və sənədləşdirmə",
    data: { status: "PLANNING", priority: "LOW", color: "#22c55e" },
  },
];

// --- Dəvət şablonları ---
const DEFAULT_INVITATION_TEMPLATES: DefaultTemplateSeed[] = [
  {
    name: "Standart Üzv Dəvəti",
    description: "Tam hüquqlu komanda üzvü üçün adi dəvət mətni",
    data: {
      inviteType: "MEMBER",
      message: "Sizi WorkSpace ERP sistemində komandamıza qoşulmağa dəvət edirik!",
    },
  },
  {
    name: "Qonaq (Guest) Dəvəti",
    description: "Yalnız seçilmiş layihələrə məhdud girişi olan xarici tərəfdaş üçün",
    data: {
      inviteType: "GUEST",
      message: "Sizi məhdud girişlə (qonaq) müəyyən layihələrimizə dəvət edirik.",
    },
  },
];

// --- Rol şablonları (yeni Rol yaradanda başlanğıc icazə dəsti) ---
const DEFAULT_ROLE_TEMPLATES: DefaultTemplateSeed[] = [
  {
    name: "Layihə Meneceri",
    description: "Layihə və tapşırıqları tam idarə edən, komanda üzvlərini təyin edə bilən rol",
    data: {
      color: "#f59e0b",
      permissionKeys: [
        "CAN_CREATE_PROJECT", "CAN_EDIT_PROJECT", "CAN_VIEW_PROJECT", "CAN_ARCHIVE_PROJECT",
        "CAN_CHANGE_PROJECT_STATUS", "CAN_ASSIGN_PROJECT_MEMBER",
        "CAN_CREATE_TASK", "CAN_EDIT_TASK", "CAN_DELETE_TASK", "CAN_VIEW_TASK",
        "CAN_ASSIGN_TASK", "CAN_CHANGE_TASK_STATUS", "CAN_SET_TASK_PRIORITY", "CAN_SET_TASK_DEADLINE",
        "CAN_COMMENT", "CAN_VIEW_REPORTS",
      ],
    },
  },
  {
    name: "İcraçı (Contributor)",
    description: "Yalnız tapşırıqlar üzərində işləyən, öz işini idarə edən standart işçi",
    data: {
      color: "#3b82f6",
      permissionKeys: [
        "CAN_VIEW_PROJECT", "CAN_CREATE_TASK", "CAN_EDIT_TASK", "CAN_VIEW_TASK",
        "CAN_CHANGE_TASK_STATUS", "CAN_CREATE_SUBTASK", "CAN_COMPLETE_SUBTASK",
        "CAN_COMMENT", "CAN_EDIT_OWN_COMMENT", "CAN_UPLOAD_FILE", "CAN_VIEW_FILES",
      ],
    },
  },
  {
    name: "Yalnız Baxış (Read-Only)",
    description: "Heç nəyi dəyişə bilməyən, sadəcə izləyə bilən auditor/müşahidəçi rolu",
    data: {
      color: "#64748b",
      permissionKeys: [
        "CAN_VIEW_PROJECT", "CAN_VIEW_TASK", "CAN_VIEW_DEPARTMENTS", "CAN_VIEW_FILES", "CAN_VIEW_REPORTS",
      ],
    },
  },
];

const DEFAULT_TEMPLATES: Record<TemplateType, DefaultTemplateSeed[]> = {
  PROJECT: DEFAULT_PROJECT_TEMPLATES,
  INVITATION: DEFAULT_INVITATION_TEMPLATES,
  ROLE: DEFAULT_ROLE_TEMPLATES,
};

/**
 * Şirkətin verilmiş tipdə heç bir şablonu yoxdursa, standart (isSystem=true)
 * dəsti yaradır. CRM Stages-dəki "lazy-seed on first GET" nümunəsini təkrarlayır.
 */
export async function ensureDefaultTemplates(companyId: string, type: TemplateType): Promise<void> {
  const count = await prisma.template.count({ where: { companyId, type } });
  if (count > 0) return;

  const seeds = DEFAULT_TEMPLATES[type] ?? [];
  if (seeds.length === 0) return;

  await prisma.template.createMany({
    data: seeds.map((seed) => ({
      companyId,
      type,
      name: seed.name,
      description: seed.description,
      data: seed.data as Prisma.InputJsonValue,
      isSystem: true,
    })),
    skipDuplicates: true,
  });
}

/**
 * Şablon növünə görə lazımi RBAC icazələrini xəritələndirir. Ayrıca
 * "CAN_MANAGE_TEMPLATES" icazəsi yaratmaq əvəzinə, mövcud domen icazələri
 * təkrar istifadə olunur (layihə şablonu → layihə icazələri və s.).
 */
export function getTemplateManagePermissions(
  type: TemplateType
): { create: PermissionKey; edit: PermissionKey; delete: PermissionKey } {
  switch (type) {
    case "ROLE":
      return { create: "CAN_CREATE_ROLE", edit: "CAN_EDIT_ROLE", delete: "CAN_DELETE_ROLE" };
    case "INVITATION":
      return { create: "CAN_INVITE_USER", edit: "CAN_INVITE_USER", delete: "CAN_INVITE_USER" };
    case "PROJECT":
    default:
      return { create: "CAN_CREATE_PROJECT", edit: "CAN_EDIT_PROJECT", delete: "CAN_DELETE_PROJECT" };
  }
}

// =============================================================================
// Marketinq Şablonları (MarketingTemplate) — Email/SMS/WhatsApp/Instagram üçün
// eyni "lazy-seed system default" məntiqi. `MarketingTemplate` klonlanmır —
// kampaniya yaradılarkən `subject`/`content` sahələri sadəcə köçürülür, ona görə
// şablonun sonrakı redaktəsi əvvəlki kampaniyalara TƏSİR ETMİR.
// =============================================================================

type DefaultMarketingTemplateSeed = {
  name: string;
  subject?: string;
  content: string;
};

const DEFAULT_EMAIL_TEMPLATES: DefaultMarketingTemplateSeed[] = [
  {
    name: "Xoş Gəlmisiniz",
    subject: "Bizimlə olduğunuz üçün təşəkkür edirik! 🎉",
    content:
      "Salam {{name}},\n\nBizə qoşulduğunuz üçün təşəkkür edirik! Komandamız sizinlə əməkdaşlığa çox həvəslidir.\n\nSuallarınız olarsa, birbaşa bu email-ə cavab yaza bilərsiniz.\n\nHörmətlə,\nKomanda",
  },
  {
    name: "Endirim Kampaniyası",
    subject: "Sizin üçün xüsusi təklifimiz var 🔥",
    content:
      "Salam {{name}},\n\nMəhdud müddətli xüsusi endirimimizdən yararlanın! Ətraflı məlumat üçün bizimlə əlaqə saxlayın.\n\nHörmətlə,\nKomanda",
  },
];

const DEFAULT_SMS_TEMPLATES: DefaultMarketingTemplateSeed[] = [
  {
    name: "Xatırlatma",
    content: "Salam {{name}}, bu sizin üçün bir xatırlatmadır. Ətraflı: {{link}}",
  },
  {
    name: "Promo Kod",
    content: "Salam {{name}}! Xüsusi endirim kodunuz: {{code}}. Məhdud müddətlidir!",
  },
];

const DEFAULT_WHATSAPP_TEMPLATES: DefaultMarketingTemplateSeed[] = [
  {
    name: "Salamlama Mesajı",
    content: "Salam {{name}} 👋\nBizimlə əlaqə saxladığınız üçün təşəkkür edirik. Sizə necə kömək edə bilərik?",
  },
  {
    name: "Sifariş Statusu",
    content: "Salam {{name}}, sifarişiniz ({{orderId}}) hazırlanır. Tezliklə sizinlə əlaqə saxlayacağıq!",
  },
];

const DEFAULT_INSTAGRAM_TEMPLATES: DefaultMarketingTemplateSeed[] = [
  {
    name: "Məhsul Tanıtımı",
    content: "✨ Yeni məhsulumuzla tanış olun! Daha ətraflı məlumat üçün bio-dakı linkə keçin. #yenilik",
  },
];

const DEFAULT_MARKETING_TEMPLATES: Record<CampaignType, DefaultMarketingTemplateSeed[]> = {
  EMAIL: DEFAULT_EMAIL_TEMPLATES,
  SMS: DEFAULT_SMS_TEMPLATES,
  WHATSAPP: DEFAULT_WHATSAPP_TEMPLATES,
  INSTAGRAM: DEFAULT_INSTAGRAM_TEMPLATES,
};

/**
 * Şirkətin verilmiş kanalda heç bir marketinq şablonu yoxdursa, standart
 * (isSystem=true) nümunə mətnlər yaradır.
 */
export async function ensureDefaultMarketingTemplates(companyId: string, type: CampaignType): Promise<void> {
  const count = await prisma.marketingTemplate.count({ where: { companyId, type } });
  if (count > 0) return;

  const seeds = DEFAULT_MARKETING_TEMPLATES[type] ?? [];
  if (seeds.length === 0) return;

  await prisma.marketingTemplate.createMany({
    data: seeds.map((seed) => ({
      companyId,
      type,
      name: seed.name,
      subject: seed.subject || null,
      content: seed.content,
      isSystem: true,
    })),
  });
}
