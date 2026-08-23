import type {
  CampaignStatus,
  CampaignType,
  PrismaClient,
  ProjectPriority,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";
import { ORG_DEPARTMENTS, ORG_PEOPLE, type OrgDeptKey } from "./org-structure";

type Db = PrismaClient;

export type DemoSeedContext = {
  companyId: string;
  founderId: string;
  userIdByEmail: Map<string, string>;
  deptIdByKey: Map<OrgDeptKey, string>;
};

export type DemoSeedCounts = {
  projectCount: number;
  taskCount: number;
  crmCompanyCount: number;
  crmContactCount: number;
  dealCount: number;
  warehouseCount: number;
  productCount: number;
  movementCount: number;
  segmentCount: number;
  campaignCount: number;
  taskTemplateCount: number;
  marketingTemplateCount: number;
};

type TaskSeed = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueInDays: number;
  estimatedHours: number;
  actualHours?: number;
};

type ProjectPair = {
  active: { name: string; description: string; priority: ProjectPriority; category: string; tasks: TaskSeed[] };
  planned: { name: string; description: string; priority: ProjectPriority; category: string; tasks: TaskSeed[] };
};

const day = (offset: number) => {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

function pick<T>(list: T[], index: number): T {
  return list[index % list.length];
}

function peopleOf(deptKey: OrgDeptKey) {
  const direct = ORG_PEOPLE.filter((p) => p.deptKey === deptKey);
  if (direct.length > 0) return direct;
  return ORG_PEOPLE.filter((p) => {
    const def = ORG_DEPARTMENTS.find((d) => d.key === p.deptKey);
    return def?.parentKey === deptKey || p.headOfDeptKey === deptKey;
  });
}

const PROJECTS: Partial<Record<OrgDeptKey, ProjectPair>> = {
  board: {
    active: {
      name: "2026 Strateji İcra",
      description: "İllik KPI-lərin icrası, şöbə hesabatları və idarə heyəti qərarları.",
      priority: "HIGH",
      category: "İdarəetmə",
      tasks: [
        { title: "Q3 idarə heyəti hesabatı", description: "Bütün şöbələrin KPI icmalını hazırla.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 5, estimatedHours: 12, actualHours: 6 },
        { title: "Risk reyestri yeniləməsi", description: "Əməliyyat və maliyyə risklərini yenilə.", status: "TODO", priority: "MEDIUM", dueInDays: 12, estimatedHours: 8 },
        { title: "İyun iclas protokolu", description: "Son iclasın qərarlarını yekunlaşdır.", status: "DONE", priority: "MEDIUM", dueInDays: -10, estimatedHours: 4, actualHours: 4 },
        { title: "Şöbə müdirləri ilə sinxron", description: "Həftəlik status görüşünü təşkil et.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 2, estimatedHours: 3, actualHours: 1 },
      ],
    },
    planned: {
      name: "2027 Büdcə Çərçivəsi",
      description: "Növbəti ilin investisiya və əməliyyat büdcəsinin hazırlanması.",
      priority: "MEDIUM",
      category: "İdarəetmə",
      tasks: [
        { title: "Şöbə büdcə tələblərini topla", description: "Hər şöbədən 2027 tələb formalarını al.", status: "TODO", priority: "HIGH", dueInDays: 30, estimatedHours: 16 },
        { title: "CAPEX siyahısını təsdiqlə", description: "Anbar və avtopark investisiyalarını qiymətləndir.", status: "TODO", priority: "MEDIUM", dueInDays: 40, estimatedHours: 10 },
        { title: "Ssenari modelləri", description: "Baza / pesimist / optimist ssenarilər.", status: "TODO", priority: "LOW", dueInDays: 45, estimatedHours: 14 },
      ],
    },
  },
  data: {
    active: {
      name: "KPI Dashboard 2.0",
      description: "Daşıma, anbar və satış metriklərinin vahid panelə köçürülməsi.",
      priority: "HIGH",
      category: "Data",
      tasks: [
        { title: "Mənbə məlumatların auditi", description: "WMS, CRM və 1C sahələrini xəritələ.", status: "DONE", priority: "HIGH", dueInDays: -8, estimatedHours: 10, actualHours: 11 },
        { title: "Flot istifadə dərəcəsi modeli", description: "Boş dayanma və yüklənmə KPI-lərini hesabla.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 6, estimatedHours: 18, actualHours: 9 },
        { title: "Rəhbərlik demo-sunu hazırla", description: "CEO üçün 8 slayd icmal.", status: "TODO", priority: "MEDIUM", dueInDays: 14, estimatedHours: 6 },
        { title: "Anomaliya siqnalları", description: "Gecikən reyslər üçün alert qaydaları.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 4, estimatedHours: 12, actualHours: 3 },
      ],
    },
    planned: {
      name: "Proqnozlaşdırma Modeli",
      description: "Tələbat və ehtiyat hissəsi istehlakının proqnozu.",
      priority: "MEDIUM",
      category: "Data",
      tasks: [
        { title: "Tarixi 24 aylıq dataset", description: "Satış və ehtiyat hərəkətlərini çıxar.", status: "TODO", priority: "HIGH", dueInDays: 25, estimatedHours: 12 },
        { title: "Feature engineering", description: "Mövsümi və marşrut dəyişənləri.", status: "TODO", priority: "MEDIUM", dueInDays: 35, estimatedHours: 16 },
        { title: "Pilot: təkər istehlakı", description: "295/80R22.5 üçün ilk model.", status: "TODO", priority: "LOW", dueInDays: 50, estimatedHours: 20 },
      ],
    },
  },
  legal: {
    active: {
      name: "Müqavilə Standartlaşdırması",
      description: "Daşıma, anbar və xidmət müqavilələrinin vahid şablonlara keçidi.",
      priority: "HIGH",
      category: "Hüquq",
      tasks: [
        { title: "Ekspeditor müqaviləsi v3", description: "CMR və sığorta bəndlərini yenilə.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 7, estimatedHours: 14, actualHours: 5 },
        { title: "Təchizatçı NDA-ları", description: "WMS təchizatçıları üçün NDA paketi.", status: "TODO", priority: "MEDIUM", dueInDays: 15, estimatedHours: 8 },
        { title: "Köhnə müqavilə auditi", description: "2024-cü il müqavilələrini nəzərdən keçir.", status: "DONE", priority: "MEDIUM", dueInDays: -12, estimatedHours: 20, actualHours: 18 },
        { title: "Claim prosedur qaydası", description: "Zərər/gecikmə iddialarının axını.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 3, estimatedHours: 10, actualHours: 4 },
      ],
    },
    planned: {
      name: "Daxili Audit 2026 H2",
      description: "Anbar, kassa və tender proseslərinin yoxlanılması.",
      priority: "HIGH",
      category: "Audit",
      tasks: [
        { title: "Audit proqramı", description: "Seçmə və risk sahələrini təsdiqlə.", status: "TODO", priority: "HIGH", dueInDays: 28, estimatedHours: 8 },
        { title: "Anbar nümunə seçimi", description: "Azalan qalıqlı SKU-ları daxil et.", status: "TODO", priority: "MEDIUM", dueInDays: 36, estimatedHours: 6 },
        { title: "Kassa yoxlama cədvəli", description: "Nağd əməliyyatların testi.", status: "TODO", priority: "MEDIUM", dueInDays: 42, estimatedHours: 10 },
      ],
    },
  },
  it: {
    active: {
      name: "Server Miqrasiyası",
      description: "On-prem ERP və fayl serverlərinin yeni virtual infrastrukturə köçürülməsi.",
      priority: "CRITICAL",
      category: "İT",
      tasks: [
        { title: "Backup və rollback planı", description: "Həftəlik snapshot və 48 saatlıq RPO.", status: "DONE", priority: "URGENT", dueInDays: -6, estimatedHours: 8, actualHours: 9 },
        { title: "AD və DNS köçürməsi", description: "Domain controller-ləri yeni hostlara keçir.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 4, estimatedHours: 16, actualHours: 7 },
        { title: "Helpdesk cutover pəncərəsi", description: "İstifadəçi elanı və növbə planı.", status: "TODO", priority: "HIGH", dueInDays: 9, estimatedHours: 6 },
        { title: "Təhlükəsizlik skanı", description: "Yeni hostlarda vulnerability scan.", status: "IN_PROGRESS", priority: "MEDIUM", dueInDays: 11, estimatedHours: 10, actualHours: 2 },
        { title: "Köhnə serverlərin söndürülməsi", description: "Miqrasiya təsdiqindən sonra decommission.", status: "TODO", priority: "LOW", dueInDays: 20, estimatedHours: 4 },
      ],
    },
    planned: {
      name: "Zero-Trust VPN",
      description: "Uzaq girişin MFA və cihaz yoxlaması ilə yenilənməsi.",
      priority: "HIGH",
      category: "İT",
      tasks: [
        { title: "Vendor qısa siyahısı", description: "3 həllin müqayisə cədvəli.", status: "TODO", priority: "MEDIUM", dueInDays: 22, estimatedHours: 8 },
        { title: "Pilot qrup (İT + Maliyyə)", description: "12 istifadəçi ilə sınaq.", status: "TODO", priority: "HIGH", dueInDays: 40, estimatedHours: 12 },
        { title: "Şöbə təlim materialı", description: "Qısa PDF və ekran görüntüləri.", status: "TODO", priority: "LOW", dueInDays: 48, estimatedHours: 5 },
      ],
    },
  },
  marketing: {
    active: {
      name: "M-Trans Yay Kampaniyası",
      description: "Yükdaşıma və anbar xidmətlərinin yay mövsümü üçün tanıtımı.",
      priority: "HIGH",
      category: "Marketinq",
      tasks: [
        { title: "Landing səhifə məzmunu", description: "AZ/EN qısa təklif mətnləri.", status: "DONE", priority: "HIGH", dueInDays: -4, estimatedHours: 8, actualHours: 7 },
        { title: "VIP tərəfdaş email seriyası", description: "3 məktubluk drip.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 3, estimatedHours: 10, actualHours: 4 },
        { title: "Tender izləmə cədvəli", description: "Açıq tenderləri rəqib analizi ilə yenilə.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 6, estimatedHours: 12, actualHours: 5 },
        { title: "WhatsApp status kreativi", description: "Flot və anbar şəkilləri.", status: "TODO", priority: "MEDIUM", dueInDays: 10, estimatedHours: 6 },
        { title: "Həftəlik lead icmalı", description: "CRM-də yeni müraciətləri təsnif et.", status: "TODO", priority: "MEDIUM", dueInDays: 2, estimatedHours: 4 },
      ],
    },
    planned: {
      name: "Q4 Tender Portfeli",
      description: "Payız tender mövsümü üçün təklif və brend paketi.",
      priority: "MEDIUM",
      category: "Satış",
      tasks: [
        { title: "Tender kalendarı", description: "Oktyabr-dekabr elanları.", status: "TODO", priority: "HIGH", dueInDays: 32, estimatedHours: 8 },
        { title: "Case study: Port Baku", description: "Uğurlu dəniz+avto zənciri.", status: "TODO", priority: "MEDIUM", dueInDays: 38, estimatedHours: 14 },
        { title: "Qiymət siyasəti slaydları", description: "Satış qrupu üçün one-pager.", status: "TODO", priority: "LOW", dueInDays: 44, estimatedHours: 6 },
      ],
    },
  },
  hr: {
    active: {
      name: "Onboarding 2026",
      description: "Yeni sürücü və ofis işçilərinin qəbul prosesinin rəqəmsallaşdırılması.",
      priority: "HIGH",
      category: "HR",
      tasks: [
        { title: "Sürücü sənəd checklisti", description: "Vəsiqə, tibbi və SƏTƏM paketi.", status: "DONE", priority: "HIGH", dueInDays: -7, estimatedHours: 6, actualHours: 6 },
        { title: "1-ci həftə mentor təyinatı", description: "Hər yeni işçi üçün mentor.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 5, estimatedHours: 4, actualHours: 1 },
        { title: "SƏTƏM təlim cədvəli", description: "Avqust-sentyabr sessiyaları.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 8, estimatedHours: 8, actualHours: 3 },
        { title: "Ofis akses kartları", description: "IT ilə birgə kart sifarişi.", status: "TODO", priority: "MEDIUM", dueInDays: 12, estimatedHours: 3 },
      ],
    },
    planned: {
      name: "İşçi Məmnuniyyəti Sorğusu",
      description: "Anonim eNPS və şöbə üzrə əks-əlaqə.",
      priority: "LOW",
      category: "HR",
      tasks: [
        { title: "Sorğu suallarını yekunlaşdır", description: "12 sual, 5 ballıq şkala.", status: "TODO", priority: "MEDIUM", dueInDays: 26, estimatedHours: 5 },
        { title: "Anonimlik mexanizmi", description: "IT ilə token əsaslı toplama.", status: "TODO", priority: "HIGH", dueInDays: 34, estimatedHours: 8 },
        { title: "Nəticə workshop-u", description: "Şöbə müdirləri ilə icmal.", status: "TODO", priority: "LOW", dueInDays: 55, estimatedHours: 4 },
      ],
    },
  },
  finance: {
    active: {
      name: "Q3 Audit",
      description: "III rüb maliyyə bağlanışı, kassa və debitor yoxlaması.",
      priority: "CRITICAL",
      category: "Maliyyə",
      tasks: [
        { title: "Debitor yaşlandırma", description: "30/60/90 gün kəsimi.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 3, estimatedHours: 10, actualHours: 4 },
        { title: "Kassa inventarizasiyası", description: "Nağd qalıqların tutuşdurulması.", status: "TODO", priority: "HIGH", dueInDays: 6, estimatedHours: 6 },
        { title: "ƏDV bəyannaməsi qaralaması", description: "Avqust dövriyyəsi.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 9, estimatedHours: 12, actualHours: 5 },
        { title: "İyul bağlanış jurnalı", description: "Müxabirləşmələri bağla.", status: "DONE", priority: "MEDIUM", dueInDays: -9, estimatedHours: 8, actualHours: 8 },
        { title: "Təchizatçı ödəniş cədvəli", description: "Ehtiyat hissəsi fakturaları.", status: "TODO", priority: "MEDIUM", dueInDays: 11, estimatedHours: 5 },
      ],
    },
    planned: {
      name: "2027 Büdcə Planlaması",
      description: "Gəlir, yanacaq, ehtiyat və əmək haqqı ssenariləri.",
      priority: "HIGH",
      category: "Maliyyə",
      tasks: [
        { title: "Yanacaq xərc proqnozu", description: "Reys həcminə görə.", status: "TODO", priority: "HIGH", dueInDays: 28, estimatedHours: 12 },
        { title: "Ehtiyat hissəsi büdcəsi", description: "WMS min-stock əsasında.", status: "TODO", priority: "MEDIUM", dueInDays: 36, estimatedHours: 9 },
        { title: "CFO brifinqi", description: "İdarə heyəti slaydları.", status: "TODO", priority: "MEDIUM", dueInDays: 48, estimatedHours: 6 },
      ],
    },
  },
  logistics: {
    active: {
      name: "Flot İstismar Optimizasiyası",
      description: "Boş reyslərin azaldılması və anbar-çıxış sinxronu.",
      priority: "HIGH",
      category: "Logistika",
      tasks: [
        { title: "Boş reys hesabatı", description: "Son 30 günün boş km analizi.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 4, estimatedHours: 8, actualHours: 3 },
        { title: "Anbar yükləmə pəncərələri", description: "Binəqədi anbarı üçün slotlar.", status: "TODO", priority: "MEDIUM", dueInDays: 10, estimatedHours: 6 },
        { title: "COO həftəlik icmalı", description: "Nəqliyyat + təmir statusu.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 1, estimatedHours: 3, actualHours: 1 },
        { title: "İyul SLA hesabatı", description: "Vaxtında çatdırılma faizi.", status: "DONE", priority: "MEDIUM", dueInDays: -11, estimatedHours: 5, actualHours: 5 },
      ],
    },
    planned: {
      name: "Qış Hazırlığı",
      description: "Təkər, antifriz və diaqnostika ehtiyatının artırılması.",
      priority: "MEDIUM",
      category: "Logistika",
      tasks: [
        { title: "Qış təkər ehtiyacı", description: "295/80R22.5 sayımı.", status: "TODO", priority: "HIGH", dueInDays: 30, estimatedHours: 6 },
        { title: "Antifriz sifariş planı", description: "Təchizatçı lead-time.", status: "TODO", priority: "MEDIUM", dueInDays: 38, estimatedHours: 4 },
        { title: "Soyuq hava SOP", description: "Sürücü təlimatları.", status: "TODO", priority: "LOW", dueInDays: 50, estimatedHours: 8 },
      ],
    },
  },
  transport: {
    active: {
      name: "Reys Planlama Avtomatlaşdırılması",
      description: "Gündəlik yük avtomobili təyinatının rəqəmsal cədvələ keçidi.",
      priority: "HIGH",
      category: "Nəqliyyat",
      tasks: [
        { title: "Sürücü növbə qrafiki", description: "Növbəti 14 gün.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 2, estimatedHours: 8, actualHours: 3 },
        { title: "CMR sənədləşməsi auditi", description: "Əksik sənədləri tap.", status: "TODO", priority: "HIGH", dueInDays: 7, estimatedHours: 6 },
        { title: "GPS treklərin yoxlanması", description: "Operator siyahısı.", status: "IN_PROGRESS", priority: "MEDIUM", dueInDays: 5, estimatedHours: 4, actualHours: 1 },
        { title: "Bakı-Qazax koridoru", description: "Yeni müntəzəm reys slotu.", status: "TODO", priority: "MEDIUM", dueInDays: 12, estimatedHours: 10 },
        { title: "İyul yanacaq aktı", description: "Sürücü hesabatlarını bağla.", status: "DONE", priority: "LOW", dueInDays: -8, estimatedHours: 5, actualHours: 5 },
      ],
    },
    planned: {
      name: "Yeni Trailer Qəbulu",
      description: "4 ədəd tentli treylerin sənəd və istismara buraxılışı.",
      priority: "MEDIUM",
      category: "Nəqliyyat",
      tasks: [
        { title: "Qeydiyyat sənədləri", description: "Şəhadətnamə və sığorta.", status: "TODO", priority: "HIGH", dueInDays: 24, estimatedHours: 8 },
        { title: "Sürücü təyinatı", description: "4 sürücü + ehtiyat.", status: "TODO", priority: "MEDIUM", dueInDays: 32, estimatedHours: 4 },
        { title: "İlkin texniki baxış", description: "Təmir şöbəsi ilə birgə.", status: "TODO", priority: "MEDIUM", dueInDays: 36, estimatedHours: 6 },
      ],
    },
  },
  repair: {
    active: {
      name: "Planlı Texniki Xidmət",
      description: "Flotun A/B/C xidmət dövrlərinin anbar ehtiyatı ilə sinxronu.",
      priority: "HIGH",
      category: "Təmir",
      tasks: [
        { title: "Əyləc bəndi dəyişimi — 6 TIR", description: "Azalan SKU: BRK-PAD.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 3, estimatedHours: 16, actualHours: 6 },
        { title: "Yağ və filter servisi", description: "5W-30 + hava/yanacaq filteri.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 6, estimatedHours: 12, actualHours: 4 },
        { title: "Diaqnostika növbəsi", description: "Check-engine siqnallı 3 maşın.", status: "TODO", priority: "HIGH", dueInDays: 8, estimatedHours: 9 },
        { title: "Avtoyuma cədvəli", description: "Həftəlik xarici/daxili yuma.", status: "TODO", priority: "LOW", dueInDays: 4, estimatedHours: 6 },
        { title: "İyul iş-order bağlanışı", description: "Usta aktlarını arxivlə.", status: "DONE", priority: "MEDIUM", dueInDays: -9, estimatedHours: 4, actualHours: 4 },
      ],
    },
    planned: {
      name: "Diaqnostika Xətti Yenilənməsi",
      description: "Yeni skaner və amortizator stendinin quraşdırılması.",
      priority: "MEDIUM",
      category: "Təmir",
      tasks: [
        { title: "Avadanlıq spesifikasiyası", description: "Təchizatçı 3 təklif.", status: "TODO", priority: "HIGH", dueInDays: 27, estimatedHours: 8 },
        { title: "Sex yerləşdirmə planı", description: "Stend üçün zona.", status: "TODO", priority: "MEDIUM", dueInDays: 35, estimatedHours: 6 },
        { title: "Usta təlimi", description: "2 günlük vendor sessiyası.", status: "TODO", priority: "LOW", dueInDays: 46, estimatedHours: 12 },
      ],
    },
  },
  international: {
    active: {
      name: "Orta Dəhliz Partnyorluğu",
      description: "Multimodal (avto-dəmir-dəniz) tərəfdaş şəbəkəsinin genişləndirilməsi.",
      priority: "HIGH",
      category: "Beynəlxalq",
      tasks: [
        { title: "Potensial agent siyahısı", description: "Qazaxıstan və Gürcüstan.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 7, estimatedHours: 10, actualHours: 4 },
        { title: "Transit vaxt SLA", description: "Bakı-Poti-İstanbul.", status: "TODO", priority: "MEDIUM", dueInDays: 14, estimatedHours: 8 },
        { title: "İyul volume icmalı", description: "Modallar üzrə TEU/ton.", status: "DONE", priority: "MEDIUM", dueInDays: -5, estimatedHours: 6, actualHours: 6 },
        { title: "Müştəri qısa brifinq", description: "VIP tərəfdaşlar üçün one-pager.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 4, estimatedHours: 5, actualHours: 2 },
      ],
    },
    planned: {
      name: "Yeni Koridor: Bakı–Aktau",
      description: "Dəniz+avto kombinə xidmətinin yumşaq buraxılışı.",
      priority: "MEDIUM",
      category: "Beynəlxalq",
      tasks: [
        { title: "Liman tarifləri", description: "Aktau handling fee.", status: "TODO", priority: "HIGH", dueInDays: 29, estimatedHours: 7 },
        { title: "Sığorta şərtləri", description: "Hüquq ilə birgə.", status: "TODO", priority: "MEDIUM", dueInDays: 37, estimatedHours: 6 },
        { title: "Pilot müştəri", description: "2 konteyner sınaq reysi.", status: "TODO", priority: "LOW", dueInDays: 52, estimatedHours: 10 },
      ],
    },
  },
  int_multimodal: {
    active: {
      name: "Multimodal Slot İdarəetməsi",
      description: "Konteyner slotları və qiymət təkliflərinin sinxronu.",
      priority: "HIGH",
      category: "Multimodal",
      tasks: [
        { title: "Həftəlik pricing cədvəli", description: "Avto+dəmir+dəniz kombinələri.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 3, estimatedHours: 8, actualHours: 3 },
        { title: "Konteyner izləmə uyğunsuzluqları", description: "Operator logları.", status: "TODO", priority: "URGENT", dueInDays: 2, estimatedHours: 5 },
        { title: "Müştəri təklifi: TechCorp", description: "3 variantlı rate.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 6, estimatedHours: 7, actualHours: 2 },
        { title: "İyul booking bağlanışı", description: "Təsdiqlənmiş slotlar.", status: "DONE", priority: "MEDIUM", dueInDays: -7, estimatedHours: 4, actualHours: 4 },
      ],
    },
    planned: {
      name: "Door-to-Door Paketi",
      description: "Şəhərə qədər çatdırılma ilə multimodal məhsul.",
      priority: "MEDIUM",
      category: "Multimodal",
      tasks: [
        { title: "Son mil tərəfdaşı", description: "Bakı daxili paylama.", status: "TODO", priority: "HIGH", dueInDays: 26, estimatedHours: 8 },
        { title: "Paket qiyməti", description: "All-in tarif.", status: "TODO", priority: "MEDIUM", dueInDays: 34, estimatedHours: 10 },
        { title: "Satış skripti", description: "Marketinqə ötürmə.", status: "TODO", priority: "LOW", dueInDays: 42, estimatedHours: 4 },
      ],
    },
  },
  int_road: {
    active: {
      name: "Quru Dəhlizi — TIR Parkı",
      description: "Türkiyə və Gürcüstan istiqamətində TIR dövriyyəsinin artırılması.",
      priority: "HIGH",
      category: "Quru",
      tasks: [
        { title: "TIR karnet ehtiyatı", description: "Növbəti 45 gün.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 5, estimatedHours: 4, actualHours: 1 },
        { title: "Sərhəd gözləmə hesabatı", description: "Red Bridge / Sarpi.", status: "TODO", priority: "MEDIUM", dueInDays: 8, estimatedHours: 6 },
        { title: "Yeni müştəri rate-i", description: "Baku Logistics LLC.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 3, estimatedHours: 5, actualHours: 2 },
        { title: "İyul TIR statistika", description: "Doluluk və transit vaxt.", status: "DONE", priority: "LOW", dueInDays: -6, estimatedHours: 3, actualHours: 3 },
      ],
    },
    planned: {
      name: "İran Tranzit Alternativi",
      description: "Cənub dəhlizi üçün ilkin qiymətləndirmə.",
      priority: "LOW",
      category: "Quru",
      tasks: [
        { title: "İcazə və viza tələbləri", description: "Hüquq ilə checklist.", status: "TODO", priority: "MEDIUM", dueInDays: 33, estimatedHours: 8 },
        { title: "Yanacaq və yol rüsumu", description: "Xərc modeli.", status: "TODO", priority: "MEDIUM", dueInDays: 41, estimatedHours: 7 },
        { title: "Risk qeydi", description: "Sığorta şərtləri.", status: "TODO", priority: "LOW", dueInDays: 50, estimatedHours: 5 },
      ],
    },
  },
  int_rail: {
    active: {
      name: "Dəmir Yolu Blok-Tren",
      description: "Həftəlik blok-tren slotlarının doldurulması.",
      priority: "HIGH",
      category: "Dəmir yolu",
      tasks: [
        { title: "Vağzal slot təsdiqi", description: "növbəti 4 həftə.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 4, estimatedHours: 6, actualHours: 2 },
        { title: "Vaqon ərizələri", description: "Operator sistemi.", status: "TODO", priority: "HIGH", dueInDays: 9, estimatedHours: 8 },
        { title: "Müştəri: Silk Road Trading", description: "2 vaqon taxıl.", status: "IN_PROGRESS", priority: "MEDIUM", dueInDays: 7, estimatedHours: 5, actualHours: 1 },
        { title: "İyul vaqon aktı", description: "Boş/dolu tutuşdurma.", status: "DONE", priority: "LOW", dueInDays: -8, estimatedHours: 4, actualHours: 4 },
      ],
    },
    planned: {
      name: "Ələt Terminalı İnteqrasiyası",
      description: "Dəmir-dəniz keçidinin sənəd axını.",
      priority: "MEDIUM",
      category: "Dəmir yolu",
      tasks: [
        { title: "Terminal SOP", description: "Qəbul-təhvil addımları.", status: "TODO", priority: "HIGH", dueInDays: 31, estimatedHours: 10 },
        { title: "EDI sahə xəritəsi", description: "Data şöbəsi ilə.", status: "TODO", priority: "MEDIUM", dueInDays: 40, estimatedHours: 12 },
        { title: "Pilot konosament", description: "1 sınaq göndəriş.", status: "TODO", priority: "LOW", dueInDays: 48, estimatedHours: 6 },
      ],
    },
  },
  int_air: {
    active: {
      name: "Hava Kargo Express",
      description: "Təcili ehtiyat hissəsi və sənəd daşımalarının sürətləndirilməsi.",
      priority: "HIGH",
      category: "Hava",
      tasks: [
        { title: "GYD handling razılaşması", description: "Tarif və cut-off.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 5, estimatedHours: 8, actualHours: 3 },
        { title: "AWB şablon yeniləməsi", description: "M-Trans brendi.", status: "TODO", priority: "MEDIUM", dueInDays: 11, estimatedHours: 4 },
        { title: "Təcili ehtiyat hissəsi SLA", description: "Təmir şöbəsi ilə 24s.", status: "IN_PROGRESS", priority: "URGENT", dueInDays: 2, estimatedHours: 6, actualHours: 2 },
        { title: "İyul AWB arxivi", description: "Sənədləri bağla.", status: "DONE", priority: "LOW", dueInDays: -4, estimatedHours: 3, actualHours: 3 },
      ],
    },
    planned: {
      name: "Charter Qiymət Modeli",
      description: "Həcmli hava yükləri üçün charter kalkulyatoru.",
      priority: "LOW",
      category: "Hava",
      tasks: [
        { title: "Tarixi charter rate-lər", description: "Son 12 ay.", status: "TODO", priority: "MEDIUM", dueInDays: 28, estimatedHours: 6 },
        { title: "Minimum çəki qaydaları", description: "Pricing cədvəli.", status: "TODO", priority: "MEDIUM", dueInDays: 36, estimatedHours: 8 },
        { title: "Satış təlimi", description: "Marketinq brifinqi.", status: "TODO", priority: "LOW", dueInDays: 45, estimatedHours: 3 },
      ],
    },
  },
  int_sea: {
    active: {
      name: "Dəniz Xətti — Xəzər",
      description: "Bakı-Aktau/Türkmənbaşı bərə və konteyner slotları.",
      priority: "HIGH",
      category: "Dəniz",
      tasks: [
        { title: "Bərə cədvəli yeniləməsi", description: "Növbəti 6 reys.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 3, estimatedHours: 5, actualHours: 2 },
        { title: "Konteyner demurrage izləmə", description: "Free-time aşımı.", status: "TODO", priority: "URGENT", dueInDays: 2, estimatedHours: 6 },
        { title: "Müştəri: Port Baku Terminal", description: "Həftəlik 4 TEU.", status: "IN_PROGRESS", priority: "HIGH", dueInDays: 8, estimatedHours: 7, actualHours: 2 },
        { title: "İyul BL arxivi", description: "Konteyner aktları.", status: "DONE", priority: "LOW", dueInDays: -6, estimatedHours: 3, actualHours: 3 },
      ],
    },
    planned: {
      name: "Feeder Xətti Qiymətləndirməsi",
      description: "Poti bağlantısı üçün feeder iqtisadiyyatı.",
      priority: "MEDIUM",
      category: "Dəniz",
      tasks: [
        { title: "Liman xərcləri cədvəli", description: "Poti vs Batumi.", status: "TODO", priority: "HIGH", dueInDays: 30, estimatedHours: 8 },
        { title: "Transit vaxt müqayisəsi", description: "Dəmir vs dəniz.", status: "TODO", priority: "MEDIUM", dueInDays: 38, estimatedHours: 6 },
        { title: "Pilot booking", description: "1 × 40HC.", status: "TODO", priority: "LOW", dueInDays: 50, estimatedHours: 5 },
      ],
    },
  },
};

export async function wipeDemoOperations(prisma: Db, companyId: string) {
  await prisma.messageLog.deleteMany({ where: { deal: { companyId } } });
  await prisma.messageLog.deleteMany({ where: { customer: { companyId } } });
  await prisma.comment.deleteMany({ where: { task: { project: { companyId } } } });
  await prisma.attachment.deleteMany({ where: { task: { project: { companyId } } } });
  await prisma.taskLabel.deleteMany({ where: { task: { project: { companyId } } } });
  await prisma.callSignal.deleteMany({ where: { call: { channel: { companyId } } } });
  await prisma.call.deleteMany({ where: { channel: { companyId } } });
  await prisma.message.deleteMany({ where: { channel: { companyId } } });
  await prisma.channelMember.deleteMany({ where: { channel: { companyId } } });
  await prisma.chatChannel.deleteMany({ where: { companyId } });
  await prisma.task.deleteMany({ where: { project: { companyId } } });
  await prisma.projectMember.deleteMany({ where: { project: { companyId } } });
  await prisma.project.deleteMany({ where: { companyId } });
  await prisma.crmDeal.deleteMany({ where: { companyId } });
  await prisma.crmContact.deleteMany({ where: { companyId } });
  await prisma.crmCompany.deleteMany({ where: { companyId } });
  await prisma.crmStage.deleteMany({ where: { companyId } });
  await prisma.customer.deleteMany({ where: { companyId } });
  await prisma.marketingCampaign.deleteMany({ where: { companyId } });
  await prisma.marketingSegment.deleteMany({ where: { companyId } });
  await prisma.marketingTemplate.deleteMany({ where: { companyId } });
  await prisma.taskTemplate.deleteMany({ where: { companyId } });
  await prisma.template.deleteMany({ where: { companyId } });
  await prisma.label.deleteMany({ where: { companyId } });
  await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { companyId } } });
  await prisma.purchaseOrder.deleteMany({ where: { companyId } });
  await prisma.stockMovement.deleteMany({ where: { companyId } });
  await prisma.inventoryLevel.deleteMany({ where: { product: { companyId } } });
  await prisma.warehouseBin.deleteMany({ where: { zone: { warehouse: { companyId } } } });
  await prisma.warehouseZone.deleteMany({ where: { warehouse: { companyId } } });
  await prisma.product.deleteMany({ where: { companyId } });
  await prisma.supplier.deleteMany({ where: { companyId } });
  await prisma.warehouse.deleteMany({ where: { companyId } });
  await prisma.notification.deleteMany({ where: { companyId } });
}

async function seedProjectsAndTasks(prisma: Db, ctx: DemoSeedContext) {
  const { companyId, founderId, userIdByEmail, deptIdByKey } = ctx;
  let projectCount = 0;
  let taskCount = 0;
  const assigned = new Set<string>();
  const activeProjectByDept = new Map<OrgDeptKey, string>();

  const labels = await prisma.$transaction([
    prisma.label.create({ data: { name: "Təcili", color: "#ef4444", companyId } }),
    prisma.label.create({ data: { name: "Müştəri", color: "#3b82f6", companyId } }),
    prisma.label.create({ data: { name: "Daxili", color: "#8b5cf6", companyId } }),
    prisma.label.create({ data: { name: "Texniki", color: "#0d9488", companyId } }),
  ]);

  for (const dept of ORG_DEPARTMENTS) {
    const pair = PROJECTS[dept.key];
    if (!pair) continue;
    const members = peopleOf(dept.key)
      .map((p) => userIdByEmail.get(p.email))
      .filter((id): id is string => Boolean(id));
    if (members.length === 0) continue;

    const deptId = deptIdByKey.get(dept.key);
    const headEmail = ORG_PEOPLE.find((p) => p.headOfDeptKey === dept.key)?.email;
    const ownerId = (headEmail && userIdByEmail.get(headEmail)) || members[0];

    for (const [kind, spec] of [
      ["ACTIVE", pair.active],
      ["PLANNING", pair.planned],
    ] as const) {
      const isActive = kind === "ACTIVE";
      const project = await prisma.project.create({
        data: {
          name: spec.name,
          description: spec.description,
          status: kind as ProjectStatus,
          priority: spec.priority,
          category: spec.category,
          color: dept.color,
          startDate: isActive ? day(-21) : day(21),
          endDate: isActive ? day(35) : day(90),
          companyId,
          departmentId: deptId ?? null,
          ownerId,
          members: {
            create: members.map((userId) => ({
              userId,
              role: userId === ownerId ? "OWNER" : "MEMBER",
            })),
          },
        },
      });
      projectCount++;
      if (isActive) activeProjectByDept.set(dept.key, project.id);

      for (let i = 0; i < spec.tasks.length; i++) {
        const t = spec.tasks[i];
        const assigneeId = pick(members, i);
        assigned.add(assigneeId);
        const done = t.status === "DONE";
        const task = await prisma.task.create({
          data: {
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            position: i,
            dueDate: day(t.dueInDays),
            startDate: day(t.dueInDays - 7),
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours ?? (done ? t.estimatedHours : undefined),
            completedAt: done ? day(t.dueInDays) : null,
            projectId: project.id,
            assigneeId,
            createdById: ownerId,
          },
        });
        const label = t.priority === "URGENT" || t.priority === "HIGH" ? labels[0] : pick(labels, i + 1);
        await prisma.taskLabel.create({ data: { taskId: task.id, labelId: label.id } });
        taskCount++;
      }
    }
  }

  for (const person of ORG_PEOPLE) {
    const userId = userIdByEmail.get(person.email);
    if (!userId || assigned.has(userId)) continue;
    const projectId = activeProjectByDept.get(person.deptKey);
    if (!projectId) continue;
    const ownerId = userIdByEmail.get(ORG_PEOPLE.find((p) => p.headOfDeptKey === person.deptKey)?.email ?? "") ?? founderId;
    await prisma.task.create({
      data: {
        title: `${person.jobTitle} — həftəlik icra`,
        description: `${person.name} üçün şöbə üzrə cari əməliyyat tapşırığı.`,
        status: "TODO",
        priority: "MEDIUM",
        dueDate: day(7),
        startDate: day(0),
        estimatedHours: 6,
        projectId,
        assigneeId: userId,
        createdById: ownerId,
      },
    });
    assigned.add(userId);
    taskCount++;
  }

  return { projectCount, taskCount };
}

async function seedCrm(prisma: Db, ctx: DemoSeedContext) {
  const { companyId, userIdByEmail } = ctx;
  const salesEmails = [
    "sevinc.aliyeva@m-trans.az",
    "emin.quliyev@m-trans.az",
    "nigar.hasanli@m-trans.az",
    "tunar.mammadli@m-trans.az",
  ];
  const salesIds = salesEmails.map((e) => userIdByEmail.get(e)).filter((id): id is string => Boolean(id));
  const ownerOf = (i: number) => pick(salesIds.length ? salesIds : [ctx.founderId], i);

  const stageDefs = [
    { name: "Yeni Müraciət", color: "#2FC6F6", position: 0 },
    { name: "Danışıqlar", color: "#55D0E0", position: 1 },
    { name: "Müqavilə Hazırlığı", color: "#8284F8", position: 2 },
    { name: "Qazanıldı", color: "#F7A700", position: 3 },
    { name: "İtirilmiş", color: "#A8ADB4", position: 4 },
  ];
  await prisma.crmStage.createMany({ data: stageDefs.map((s) => ({ ...s, companyId })) });
  const stages = await prisma.crmStage.findMany({ where: { companyId }, orderBy: { position: "asc" } });
  const stageByName = new Map(stages.map((s) => [s.name, s]));

  const companies = [
    { name: "Baku Logistics LLC", industry: "Logistika", website: "https://bakulogistics.az", phone: "+994125550101", email: "info@bakulogistics.az", address: "Bakı, Xətai r." },
    { name: "TechCorp", industry: "İT / Avadanlıq", website: "https://techcorp.az", phone: "+994125550202", email: "sales@techcorp.az", address: "Bakı, Nəsimi r." },
    { name: "Caspian Oil Services", industry: "Neft servis", website: "https://caspianoil.az", phone: "+994125550303", email: "logistics@caspianoil.az", address: "Bakı, Səbail r." },
    { name: "Silk Road Trading", industry: "Topdan ticarət", website: "https://silkroad.az", phone: "+994125550404", email: "ops@silkroad.az", address: "Bakı, Binəqədi r." },
    { name: "AzExport MMC", industry: "İxrac", website: "https://azexport.az", phone: "+994125550505", email: "contact@azexport.az", address: "Sumqayıt" },
    { name: "TransCaucasus Freight", industry: "Beynəlxalq daşıma", website: "https://tcfreight.ge", phone: "+995322000606", email: "baku@tcfreight.ge", address: "Tbilisi / Bakı nümayəndəliyi" },
    { name: "GreenLine Distribution", industry: "Distribusiya", website: "https://greenline.az", phone: "+994125550707", email: "hello@greenline.az", address: "Bakı, Nizami r." },
    { name: "Port Baku Terminal", industry: "Liman / Terminal", website: "https://portbaku.az", phone: "+994125550808", email: "ops@portbaku.az", address: "Bakı Beynəlxalq Dəniz Ticarət Limanı" },
    { name: "Caucasus Auto Parts", industry: "Ehtiyat hissələri", website: "https://caparts.az", phone: "+994125550909", email: "order@caparts.az", address: "Bakı, Xırdalan" },
    { name: "Nomad Retail Group", industry: "Retail", website: "https://nomadretail.az", phone: "+994125551010", email: "supply@nomadretail.az", address: "Bakı, Yasamal r." },
  ];

  const contacts = [
    { firstName: "Rəşad", lastName: "Əliyev", email: "rashad.aliyev@bakulogistics.az", phone: "+994502001101", position: "Logistika müdiri" },
    { firstName: "Nərmin", lastName: "Quliyeva", email: "narmin@techcorp.az", phone: "+994502001202", position: "Satınalma rəhbəri" },
    { firstName: "Elşən", lastName: "Məmmədov", email: "elshan@caspianoil.az", phone: "+994502001303", position: "Supply Chain Lead" },
    { firstName: "Günel", lastName: "Həsənli", email: "gunel@silkroad.az", phone: "+994502001404", position: "Əməliyyatlar" },
    { firstName: "Kamran", lastName: "İsmayılov", email: "kamran@azexport.az", phone: "+994502001505", position: "İxrac meneceri" },
    { firstName: "Tamar", lastName: "Beridze", email: "tamar@tcfreight.ge", phone: "+995555001606", position: "Country Manager" },
    { firstName: "Aysel", lastName: "Rzayeva", email: "aysel@greenline.az", phone: "+994502001707", position: "Distribusiya" },
    { firstName: "Farid", lastName: "Huseynov", email: "farid@portbaku.az", phone: "+994502001808", position: "Terminal əməliyyatları" },
    { firstName: "Leyla", lastName: "Nəsirova", email: "leyla@caparts.az", phone: "+994502001909", position: "Satış direktoru" },
    { firstName: "Orxan", lastName: "Vəliyev", email: "orxan@nomadretail.az", phone: "+994502002010", position: "Təchizat üzrə müdir" },
  ];

  const crmCompanyIds: string[] = [];
  const crmContactIds: string[] = [];
  const customerIds: string[] = [];

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const created = await prisma.crmCompany.create({ data: { ...c, companyId } });
    crmCompanyIds.push(created.id);
    const ct = contacts[i];
    const contact = await prisma.crmContact.create({
      data: { ...ct, companyId, crmCompanyId: created.id },
    });
    crmContactIds.push(contact.id);
    const customer = await prisma.customer.create({
      data: {
        name: `${ct.firstName} ${ct.lastName}`,
        company: c.name,
        phone: ct.phone,
        email: ct.email,
        source: "CRM",
        companyId,
      },
    });
    customerIds.push(customer.id);
  }

  const dealSeeds: {
    title: string;
    value: number;
    stage: string;
    status: string;
    probability: number;
    companyIndex: number;
    closeInDays: number;
  }[] = [
    { title: "Bakı daxili paylama — 12 TIR", value: 28500, stage: "Yeni Müraciət", status: "OPEN", probability: 20, companyIndex: 0, closeInDays: 25 },
    { title: "Ehtiyat hissəsi air-cargo", value: 9200, stage: "Yeni Müraciət", status: "OPEN", probability: 15, companyIndex: 1, closeInDays: 18 },
    { title: "Neft servis baza daşıması", value: 64000, stage: "Yeni Müraciət", status: "OPEN", probability: 25, companyIndex: 2, closeInDays: 30 },
    { title: "Taxıl — 2 vaqon", value: 41000, stage: "Yeni Müraciət", status: "OPEN", probability: 20, companyIndex: 3, closeInDays: 22 },
    { title: "İxrac konsolidasiya (Avropa)", value: 37500, stage: "Danışıqlar", status: "OPEN", probability: 45, companyIndex: 4, closeInDays: 16 },
    { title: "Tbilisi-Bakı müntəzəm xətt", value: 52000, stage: "Danışıqlar", status: "OPEN", probability: 50, companyIndex: 5, closeInDays: 20 },
    { title: "Retail FTL — 8 reys/ay", value: 19600, stage: "Danışıqlar", status: "OPEN", probability: 40, companyIndex: 6, closeInDays: 14 },
    { title: "Liman-anbar shuttle", value: 44800, stage: "Danışıqlar", status: "OPEN", probability: 55, companyIndex: 7, closeInDays: 12 },
    { title: "OEM ehtiyat hissəsi paylanması", value: 15800, stage: "Danışıqlar", status: "OPEN", probability: 35, companyIndex: 8, closeInDays: 19 },
    { title: "Quru dəhliz — 20 TIR/ay", value: 88000, stage: "Müqavilə Hazırlığı", status: "OPEN", probability: 75, companyIndex: 0, closeInDays: 10 },
    { title: "Data-center avadanlığı (air)", value: 22400, stage: "Müqavilə Hazırlığı", status: "OPEN", probability: 70, companyIndex: 1, closeInDays: 8 },
    { title: "Xəzər dəniz 4 TEU/həftə", value: 72000, stage: "Müqavilə Hazırlığı", status: "OPEN", probability: 80, companyIndex: 7, closeInDays: 9 },
    { title: "Multimodal door-to-door", value: 33500, stage: "Müqavilə Hazırlığı", status: "OPEN", probability: 65, companyIndex: 5, closeInDays: 11 },
    { title: "Yay kampaniyası — 3 aylıq FTL", value: 54000, stage: "Qazanıldı", status: "WON", probability: 100, companyIndex: 6, closeInDays: -12 },
    { title: "Caspian baza — illik müqavilə", value: 185000, stage: "Qazanıldı", status: "WON", probability: 100, companyIndex: 2, closeInDays: -20 },
    { title: "Port Baku — handling + trucking", value: 96000, stage: "Qazanıldı", status: "WON", probability: 100, companyIndex: 7, closeInDays: -8 },
    { title: "Nomad anbar 3PL", value: 27300, stage: "Qazanıldı", status: "WON", probability: 100, companyIndex: 9, closeInDays: -15 },
    { title: "AzExport reefer sınağı", value: 14200, stage: "İtirilmiş", status: "LOST", probability: 0, companyIndex: 4, closeInDays: -18 },
    { title: "Caucasus Auto Parts — ekspress", value: 6100, stage: "İtirilmiş", status: "LOST", probability: 0, companyIndex: 8, closeInDays: -9 },
  ];

  for (let i = 0; i < dealSeeds.length; i++) {
    const d = dealSeeds[i];
    const stage = stageByName.get(d.stage)!;
    const crmCompanyId = crmCompanyIds[d.companyIndex];
    const crmContactId = crmContactIds[d.companyIndex];
    const company = companies[d.companyIndex];
    const contact = contacts[d.companyIndex];
    await prisma.crmDeal.create({
      data: {
        title: d.title,
        value: d.value,
        currency: "AZN",
        probability: d.probability,
        status: d.status,
        expectedCloseDate: day(d.closeInDays),
        deadline: day(d.closeInDays + 5),
        clientName: `${contact.firstName} ${contact.lastName}`,
        clientCompany: company.name,
        clientPhone: contact.phone,
        clientEmail: contact.email,
        trackingToken: `demo-${String(i + 1).padStart(3, "0")}-${companyId.slice(-6)}`,
        companyId,
        stageId: stage.id,
        crmCompanyId,
        crmContactId,
        customerId: customerIds[d.companyIndex],
        assigneeId: ownerOf(i),
      },
    });
  }

  return {
    crmCompanyCount: companies.length,
    crmContactCount: contacts.length,
    dealCount: dealSeeds.length,
    customerIds,
  };
}

async function seedWms(prisma: Db, ctx: DemoSeedContext) {
  const { companyId, userIdByEmail, founderId } = ctx;
  const logisticsEmails = [
    "ali.qasimov@m-trans.az",
    "murad.nasirov@m-trans.az",
    "leyla.aliyeva@m-trans.az",
    "rauf.aliyev@m-trans.az",
    "cavid.huseynov@m-trans.az",
  ];
  const creators = logisticsEmails.map((e) => userIdByEmail.get(e)).filter((id): id is string => Boolean(id));
  const createdBy = (i: number) => pick(creators.length ? creators : [founderId], i);

  const warehouse = await prisma.warehouse.create({
    data: {
      name: "M-Trans Əsas Anbar",
      location: "Bakı, Binəqədi sənaye zonası",
      type: "MAIN",
      companyId,
    },
  });
  const transit = await prisma.warehouse.create({
    data: {
      name: "Tranzit Anbar — GYD",
      location: "Heydər Əliyev Beynəlxalq Aeroportu",
      type: "TRANSIT",
      companyId,
    },
  });

  const [fluids, parts, tires] = await Promise.all([
    prisma.warehouseZone.create({ data: { name: "Mayelər", code: "FL", warehouseId: warehouse.id } }),
    prisma.warehouseZone.create({ data: { name: "Ehtiyat hissələri", code: "SP", warehouseId: warehouse.id } }),
    prisma.warehouseZone.create({ data: { name: "Təkərlər", code: "TY", warehouseId: warehouse.id } }),
  ]);

  const [binFl, binSp, binTy] = await Promise.all([
    prisma.warehouseBin.create({ data: { code: "A-01-01", zoneId: fluids.id } }),
    prisma.warehouseBin.create({ data: { code: "B-02-03", zoneId: parts.id } }),
    prisma.warehouseBin.create({ data: { code: "C-01-05", zoneId: tires.id } }),
  ]);

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "AutoParts Baku",
        contactName: "Sənan Quliyev",
        phone: "+994125600111",
        email: "sales@autopartsbaku.az",
        address: "Bakı, Xırdalan",
        taxId: "1700123451",
        companyId,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Caspian Oil Dist.",
        contactName: "Nigar Əliyeva",
        phone: "+994125600222",
        email: "b2b@caspianoildist.az",
        address: "Bakı, Qaradağ",
        taxId: "1700123452",
        companyId,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Michelin AZ",
        contactName: "Elçin Həsənov",
        phone: "+994125600333",
        email: "fleet@michelin.az",
        address: "Bakı, Xətai",
        taxId: "1700123453",
        companyId,
      },
    }),
  ]);

  type ProductSeed = {
    sku: string;
    barcode: string;
    name: string;
    category: string;
    unit: string;
    minStockLimit: number;
    purchasePrice: number;
    salesPrice: number;
    inbound: number;
    outbound: number;
    zone: "fluids" | "parts" | "tires";
    supplierIndex: number;
  };

  const catalog: ProductSeed[] = [
    { sku: "OIL-5W30", barcode: "4760123000018", name: "Mühərrik yağı 5W-30", category: "Mayelər", unit: "l", minStockLimit: 80, purchasePrice: 18.5, salesPrice: 26, inbound: 240, outbound: 90, zone: "fluids", supplierIndex: 1 },
    { sku: "OIL-TRN", barcode: "4760123000025", name: "Transmissiya yağı", category: "Mayelər", unit: "l", minStockLimit: 40, purchasePrice: 22, salesPrice: 31, inbound: 120, outbound: 35, zone: "fluids", supplierIndex: 1 },
    { sku: "OIL-HYD", barcode: "4760123000032", name: "Hidravlik yağ", category: "Mayelər", unit: "l", minStockLimit: 50, purchasePrice: 14, salesPrice: 20, inbound: 160, outbound: 40, zone: "fluids", supplierIndex: 1 },
    { sku: "CLN-AF", barcode: "4760123000049", name: "Soyuducu maye (antifriz)", category: "Mayelər", unit: "l", minStockLimit: 60, purchasePrice: 6.5, salesPrice: 11, inbound: 200, outbound: 55, zone: "fluids", supplierIndex: 1 },
    { sku: "BRK-PAD", barcode: "4760123000056", name: "Əyləc bəndi", category: "Əyləc sistemi", unit: "pcs", minStockLimit: 24, purchasePrice: 45, salesPrice: 68, inbound: 30, outbound: 22, zone: "parts", supplierIndex: 0 },
    { sku: "BRK-DSC", barcode: "4760123000063", name: "Disk əyləc", category: "Əyləc sistemi", unit: "pcs", minStockLimit: 12, purchasePrice: 95, salesPrice: 140, inbound: 28, outbound: 8, zone: "parts", supplierIndex: 0 },
    { sku: "TYR-295", barcode: "4760123000070", name: "Təkər 295/80R22.5", category: "Təkərlər", unit: "pcs", minStockLimit: 16, purchasePrice: 380, salesPrice: 520, inbound: 48, outbound: 12, zone: "tires", supplierIndex: 2 },
    { sku: "FLT-AIR", barcode: "4760123000087", name: "Hava filteri", category: "Filterlər", unit: "pcs", minStockLimit: 20, purchasePrice: 19, salesPrice: 29, inbound: 80, outbound: 25, zone: "parts", supplierIndex: 0 },
    { sku: "FLT-FUE", barcode: "4760123000094", name: "Yanacaq filteri", category: "Filterlər", unit: "pcs", minStockLimit: 20, purchasePrice: 16, salesPrice: 25, inbound: 70, outbound: 20, zone: "parts", supplierIndex: 0 },
    { sku: "BAT-225", barcode: "4760123000100", name: "Akkumulyator 225Ah", category: "Elektrik", unit: "pcs", minStockLimit: 6, purchasePrice: 210, salesPrice: 295, inbound: 14, outbound: 3, zone: "parts", supplierIndex: 0 },
    { sku: "LMP-H7", barcode: "4760123000117", name: "Far lampası H7", category: "Elektrik", unit: "pcs", minStockLimit: 30, purchasePrice: 4.2, salesPrice: 8, inbound: 40, outbound: 28, zone: "parts", supplierIndex: 0 },
    { sku: "WIP-24", barcode: "4760123000124", name: "Silecek lastiyi", category: "Kuzov", unit: "pcs", minStockLimit: 16, purchasePrice: 7, salesPrice: 13, inbound: 36, outbound: 10, zone: "parts", supplierIndex: 0 },
    { sku: "SUS-SHK", barcode: "4760123000131", name: "Amortizator", category: "Asqı", unit: "pcs", minStockLimit: 8, purchasePrice: 145, salesPrice: 210, inbound: 18, outbound: 4, zone: "parts", supplierIndex: 0 },
    { sku: "BLT-GEN", barcode: "4760123000148", name: "Generator kəməri", category: "Mühərrik", unit: "pcs", minStockLimit: 15, purchasePrice: 12, salesPrice: 19, inbound: 20, outbound: 14, zone: "parts", supplierIndex: 0 },
    { sku: "RAD-TRK", barcode: "4760123000155", name: "Radiator (yük avtomobili)", category: "Soyutma", unit: "pcs", minStockLimit: 4, purchasePrice: 260, salesPrice: 370, inbound: 8, outbound: 1, zone: "parts", supplierIndex: 0 },
  ];

  const binFor = (zone: ProductSeed["zone"]) => (zone === "fluids" ? binFl : zone === "tires" ? binTy : binSp);

  let movementCount = 0;
  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    const bin = binFor(p.zone);
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        unit: p.unit,
        minStockLimit: p.minStockLimit,
        purchasePrice: p.purchasePrice,
        salesPrice: p.salesPrice,
        companyId,
      },
    });

    const remaining = p.inbound - p.outbound;
    await prisma.inventoryLevel.create({
      data: {
        quantity: remaining,
        productId: product.id,
        warehouseId: warehouse.id,
        binId: bin.id,
        lotNumber: `LOT-26-${p.sku}`,
      },
    });

    await prisma.stockMovement.create({
      data: {
        type: "INBOUND",
        status: "COMPLETED",
        reference: `INB-${String(i + 1).padStart(5, "0")}`,
        comment: "İlkin qalıq / təchizatçı qəbulu",
        quantity: p.inbound,
        unitCost: p.purchasePrice,
        unitPrice: p.salesPrice,
        totalAmount: p.inbound * p.purchasePrice,
        lotNumber: `LOT-26-${p.sku}`,
        processedAt: day(-18 + (i % 5)),
        createdAt: day(-18 + (i % 5)),
        companyId,
        productId: product.id,
        toWarehouseId: warehouse.id,
        toBinId: bin.id,
        supplierId: suppliers[p.supplierIndex].id,
        createdById: createdBy(i),
      },
    });
    movementCount++;

    if (p.outbound > 0) {
      await prisma.stockMovement.create({
        data: {
          type: "OUTBOUND",
          status: "COMPLETED",
          reference: `OUT-${String(i + 1).padStart(5, "0")}`,
          comment: "Təmir sexinə / reysə buraxılış",
          quantity: p.outbound,
          unitCost: p.purchasePrice,
          unitPrice: p.salesPrice,
          totalAmount: p.outbound * p.salesPrice,
          lotNumber: `LOT-26-${p.sku}`,
          processedAt: day(-6 + (i % 4)),
          createdAt: day(-6 + (i % 4)),
          companyId,
          productId: product.id,
          fromWarehouseId: warehouse.id,
          fromBinId: bin.id,
          createdById: createdBy(i + 2),
        },
      });
      movementCount++;
    }
  }

  void transit;

  return { warehouseCount: 2, productCount: catalog.length, movementCount };
}

async function seedMarketing(prisma: Db, ctx: DemoSeedContext, customerIds: string[]) {
  const { companyId, userIdByEmail, founderId } = ctx;
  const marketer = userIdByEmail.get("aytac.ibrahimova@m-trans.az") ?? userIdByEmail.get("sevinc.aliyeva@m-trans.az") ?? founderId;
  const head = userIdByEmail.get("sevinc.aliyeva@m-trans.az") ?? founderId;

  const activeCustomers = customerIds.slice(0, 6);
  const vipCustomers = [customerIds[2], customerIds[5], customerIds[7]].filter(Boolean);
  const newLeads = customerIds.slice(6);

  const [active, vip, leads] = await Promise.all([
    prisma.marketingSegment.create({
      data: {
        name: "Aktiv Müştərilər",
        filters: { source: "CRM", hasEmail: true, status: "active" },
        customerIds: activeCustomers,
        customRecipients: [
          { name: "Rauf Kərimov", email: "rauf@logipartners.az", phone: "+994503001111" },
          { name: "Sevda Abbasova", email: "sevda@fleetplus.az", phone: "+994503001112" },
        ],
        useCount: 3,
        companyId,
      },
    }),
    prisma.marketingSegment.create({
      data: {
        name: "VIP Tərəfdaşlar",
        filters: { tag: "VIP", minDealValue: 50000 },
        customerIds: vipCustomers,
        customRecipients: [{ name: "Caspian Oil HQ", email: "procurement@caspianoil.az", phone: "+994125550303" }],
        useCount: 2,
        companyId,
      },
    }),
    prisma.marketingSegment.create({
      data: {
        name: "Yeni Lead-lər",
        filters: { source: "CRM", stage: "Yeni Müraciət" },
        customerIds: newLeads,
        customRecipients: [
          { name: "Ilkin Nəcəfov", email: "ilkin@newtrade.az", phone: "+994503001221" },
          { name: "Mehriban Qasımova", phone: "+994503001222" },
        ],
        useCount: 1,
        companyId,
      },
    }),
  ]);

  const campaigns: {
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    subject?: string;
    content: string;
    segmentId: string;
    createdById: string;
    stats: Record<string, number>;
    scheduledAt?: Date;
    sentAt?: Date;
  }[] = [
    {
      name: "Yay Kampaniyası — Email",
      type: "EMAIL",
      status: "COMPLETED",
      subject: "M-Trans yay tarifləri: FTL və anbar 3PL",
      content: "Salam {{name}}, yay mövsümü üçün FTL və anbar xidmətlərimizdə xüsusi tariflərimiz var. Ətraflı təklif üçün cavab yazın.",
      segmentId: active.id,
      createdById: marketer,
      stats: { recipientCount: 86, sentCount: 84, failedCount: 2, openRate: 41.2, clickRate: 12.8 },
      sentAt: day(-9),
    },
    {
      name: "VIP tərəfdaş təşəkkürü",
      type: "EMAIL",
      status: "COMPLETED",
      subject: "Əməkdaşlığımız üçün təşəkkür edirik",
      content: "Hörmətli {{name}}, Q2 həcminiz üçün təşəkkür edirik. Q3 üçün fərdi meneceriniz sizinlə əlaqə saxlayacaq.",
      segmentId: vip.id,
      createdById: head,
      stats: { recipientCount: 18, sentCount: 18, failedCount: 0, openRate: 72.4, clickRate: 28.1 },
      sentAt: day(-4),
    },
    {
      name: "Reys xatırlatması — SMS",
      type: "SMS",
      status: "SCHEDULED",
      content: "M-Trans: Sabahkı yükləmə pəncərəsi 09:00-12:00 (Binəqədi anbar). Əlaqə: +994125000000",
      segmentId: active.id,
      createdById: marketer,
      stats: { recipientCount: 64, sentCount: 0, failedCount: 0, openRate: 0, clickRate: 0 },
      scheduledAt: day(2),
    },
    {
      name: "Yeni lead — WhatsApp salamlama",
      type: "WHATSAPP",
      status: "DRAFT",
      content: "Salam {{name}} 👋 M-Trans-ə müraciətiniz üçün təşəkkür edirik. Marşrut və həcm göndərsəniz, 2 saat ərzində tarif təqdim edək.",
      segmentId: leads.id,
      createdById: marketer,
      stats: { recipientCount: 12, sentCount: 0, failedCount: 0, openRate: 0, clickRate: 0 },
    },
    {
      name: "Tender dəvəti — WhatsApp",
      type: "WHATSAPP",
      status: "IN_PROGRESS",
      content: "{{name}}, Q4 tender portfelimizə dəvətlisiniz. Qısa brifinqi göndərək?",
      segmentId: vip.id,
      createdById: head,
      stats: { recipientCount: 18, sentCount: 11, failedCount: 1, openRate: 63.0, clickRate: 19.4 },
    },
  ];

  for (const c of campaigns) {
    await prisma.marketingCampaign.create({
      data: {
        name: c.name,
        type: c.type,
        status: c.status,
        subject: c.subject ?? null,
        content: c.content,
        stats: c.stats,
        scheduledAt: c.scheduledAt ?? null,
        sentAt: c.sentAt ?? null,
        companyId,
        segmentId: c.segmentId,
        createdById: c.createdById,
      },
    });
  }

  return { segmentCount: 3, campaignCount: campaigns.length };
}

async function seedTemplates(prisma: Db, ctx: DemoSeedContext) {
  const { companyId, founderId, userIdByEmail, deptIdByKey } = ctx;
  const hrId = deptIdByKey.get("hr") ?? null;
  const repairId = deptIdByKey.get("repair") ?? null;
  const itId = deptIdByKey.get("it") ?? null;
  const marketer = userIdByEmail.get("aytac.ibrahimova@m-trans.az") ?? founderId;

  await prisma.taskTemplate.createMany({
    data: [
      {
        name: "Yeni İşçinin Qeydiyyatı",
        description:
          "1) Sənədləri qəbul et  2) Mentor təyin et  3) IT akses  4) SƏTƏM təlimi  5) İlk həftə check-in",
        data: { priority: "HIGH", estimatedHours: 8, checklist: ["Sənədlər", "Mentor", "Akses kartı", "SƏTƏM", "Check-in"] },
        departmentId: hrId,
        companyId,
      },
      {
        name: "Avadanlıq Baxışı",
        description:
          "TIR/treyler üçün planlı baxış: əyləc, yağ, filter, təkər təzyiqi və diaqnostika skanı.",
        data: { priority: "MEDIUM", estimatedHours: 4, checklist: ["Əyləc", "Yağ/filter", "Təkər", "Diaqnostika"] },
        departmentId: repairId,
        companyId,
      },
      {
        name: "İT İncidenti",
        description: "Kəsintinin qeydi, təsir dairəsi, müvəqqəti həll və root-cause hesabatı.",
        data: { priority: "URGENT", estimatedHours: 3, checklist: ["Təsir", "Workaround", "Fix", "Postmortem"] },
        departmentId: itId,
        companyId,
      },
    ],
  });

  await prisma.marketingTemplate.createMany({
    data: [
      {
        name: "Tərəfdaş təşəkkür emaili",
        type: "EMAIL",
        subject: "Əməkdaşlığımız üçün təşəkkür edirik — M-Trans",
        content:
          "Hörmətli {{name}},\n\nSizinlə əməkdaşlıq etdiyimiz üçün təşəkkür edirik. Növbəti daşımalarınız üçün fərdi menecerimiz sizinlə əlaqə saxlayacaq.\n\nHörmətlə,\nM-Trans Marketinq",
        companyId,
        createdById: marketer,
      },
      {
        name: "Göndəriş xatırlatması (SMS)",
        type: "SMS",
        content: "M-Trans: {{name}}, yükləmə pəncərəsi {{date}} saat {{time}}. Anbar: Binəqədi. Sual: +994125000000",
        companyId,
        createdById: marketer,
      },
      {
        name: "VIP WhatsApp təklifi",
        type: "WHATSAPP",
        content:
          "Salam {{name}} 👋 Q3 üçün fərdi FTL/multimodal tariflərimizi göndərək? 2 saat ərzində cavab veririk.",
        companyId,
        createdById: marketer,
      },
    ],
  });

  await prisma.template.createMany({
    data: [
      {
        type: "PROJECT",
        name: "Standart Layihə",
        description: "Ümumi məqsədli iş axını",
        data: { status: "PLANNING", priority: "MEDIUM", color: "#6366f1" },
        isSystem: true,
        companyId,
        createdById: founderId,
      },
      {
        type: "PROJECT",
        name: "Marketinq Kampaniyası",
        description: "Məhdud müddətli marketinq təşəbbüsü",
        data: { status: "PLANNING", priority: "HIGH", color: "#ec4899" },
        isSystem: true,
        companyId,
        createdById: founderId,
      },
      {
        type: "INVITATION",
        name: "Standart Üzv Dəvəti",
        description: "Komanda üzvü dəvəti",
        data: { inviteType: "MEMBER", message: "Sizi M-Trans ERP sisteminə dəvət edirik." },
        isSystem: true,
        companyId,
        createdById: founderId,
      },
    ],
    skipDuplicates: true,
  });

  const taskTemplateCount = await prisma.taskTemplate.count({ where: { companyId } });
  const marketingTemplateCount = await prisma.marketingTemplate.count({ where: { companyId } });
  return { taskTemplateCount, marketingTemplateCount };
}

export async function seedDemoOperations(prisma: Db, ctx: DemoSeedContext): Promise<DemoSeedCounts> {
  console.log("📦 Demo əməliyyat məlumatları doldurulur...");
  const projects = await seedProjectsAndTasks(prisma, ctx);
  const crm = await seedCrm(prisma, ctx);
  const wms = await seedWms(prisma, ctx);
  const marketing = await seedMarketing(prisma, ctx, crm.customerIds);
  const templates = await seedTemplates(prisma, ctx);
  return {
    projectCount: projects.projectCount,
    taskCount: projects.taskCount,
    crmCompanyCount: crm.crmCompanyCount,
    crmContactCount: crm.crmContactCount,
    dealCount: crm.dealCount,
    warehouseCount: wms.warehouseCount,
    productCount: wms.productCount,
    movementCount: wms.movementCount,
    segmentCount: marketing.segmentCount,
    campaignCount: marketing.campaignCount,
    taskTemplateCount: templates.taskTemplateCount,
    marketingTemplateCount: templates.marketingTemplateCount,
  };
}
