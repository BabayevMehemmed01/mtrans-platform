import type { OrgLevel, PermissionKey } from "@prisma/client";

/** Demo işçilərin vahid şifrəsi */
export const DEMO_PASSWORD = "password123";

/** Seed zamanı silinməyən hesablar */
export const PROTECTED_EMAILS = [
  "founder@mtrans.com",
  "admin@demo.com",
  "m.babayev@m-trans.az",
] as const;

export const ORG_LEVEL_COLORS: Record<OrgLevel, string> = {
  SUPERVISORY_BOARD: "#1e3a5f",
  EXECUTIVE_BOARD: "#2563eb",
  DEPARTMENT_HEAD: "#0d9488",
  SECTION_HEAD: "#ea580c",
  GROUP_LEAD: "#7c3aed",
  SPECIALIST: "#64748b",
};

export type OrgDeptKey =
  | "board"
  | "data"
  | "legal"
  | "itm"
  | "it"
  | "marketing"
  | "hr"
  | "finance"
  | "logistics"
  | "transport"
  | "repair"
  | "international"
  | "int_multimodal"
  | "int_road"
  | "int_rail"
  | "int_air"
  | "int_sea";

export type OrgRoleKey =
  | "founder"
  | "super_admin"
  | "executive"
  | "data"
  | "legal"
  | "it"
  | "marketing_head"
  | "marketing"
  | "hr"
  | "finance"
  | "logistics"
  | "international"
  | "specialist";

export type OrgDeptDef = {
  key: OrgDeptKey;
  name: string;
  code: string;
  color: string;
  icon: string;
  orgLevel: OrgLevel;
  parentKey?: OrgDeptKey;
  description: string;
};

export type OrgPersonDef = {
  email: string;
  name: string;
  jobTitle: string;
  deptKey: OrgDeptKey;
  orgLevel: OrgLevel;
  roleKey: OrgRoleKey;
  reportsToEmail?: string;
  isFounder?: boolean;
  protected?: boolean;
  headOfDeptKey?: OrgDeptKey;
};

export const ORG_DEPARTMENTS: OrgDeptDef[] = [
  {
    key: "board",
    name: "Müşahidə və İdarə Heyəti",
    code: "BOARD",
    color: "#1e3a5f",
    icon: "Landmark",
    orgLevel: "SUPERVISORY_BOARD",
    description: "Müşahidə Şurası və İdarə Heyəti",
  },
  {
    key: "data",
    name: "Data və Rəqəmsal Transformasiya",
    code: "DATA",
    color: "#0891b2",
    icon: "Database",
    orgLevel: "DEPARTMENT_HEAD",
    description: "Data Science, KPI və layihə idarəetməsi",
  },
  {
    key: "legal",
    name: "Hüquq və Audit",
    code: "LEGAL",
    color: "#475569",
    icon: "Scale",
    orgLevel: "DEPARTMENT_HEAD",
    description: "Hüquq, müqavilələr və daxili audit",
  },
  {
    key: "itm",
    name: "İT və Marketinq",
    code: "ITM",
    color: "#4f46e5",
    icon: "Monitor",
    orgLevel: "DEPARTMENT_HEAD",
    description: "İnformasiya texnologiyaları, marketinq və satış",
  },
  {
    key: "it",
    name: "İT Bölməsi",
    code: "IT",
    color: "#6366f1",
    icon: "Cpu",
    orgLevel: "SECTION_HEAD",
    parentKey: "itm",
    description: "İT dəstək və sistem təhlükəsizliyi",
  },
  {
    key: "marketing",
    name: "Marketinq və Satış Bölməsi",
    code: "MKT",
    color: "#ec4899",
    icon: "Megaphone",
    orgLevel: "SECTION_HEAD",
    parentKey: "itm",
    description: "Marketinq, satış və tender analizi",
  },
  {
    key: "hr",
    name: "HR və İnzibati İşlər",
    code: "HR",
    color: "#8b5cf6",
    icon: "Users",
    orgLevel: "DEPARTMENT_HEAD",
    description: "İnsan resursları, inzibati işlər və SƏTƏM",
  },
  {
    key: "finance",
    name: "Maliyyə Şöbəsi",
    code: "FIN",
    color: "#059669",
    icon: "DollarSign",
    orgLevel: "DEPARTMENT_HEAD",
    description: "Maliyyə, mühasibatlıq və kassa",
  },
  {
    key: "logistics",
    name: "Nəqliyyat və Təmir (Logistika)",
    code: "LOG",
    color: "#d97706",
    icon: "Truck",
    orgLevel: "DEPARTMENT_HEAD",
    description: "Nəqliyyat planlama və texniki xidmət",
  },
  {
    key: "transport",
    name: "Nəqliyyat Planlama",
    code: "TRN",
    color: "#f59e0b",
    icon: "Route",
    orgLevel: "DEPARTMENT_HEAD",
    parentKey: "logistics",
    description: "Nəqliyyat təminatı, istismar və sürücülər",
  },
  {
    key: "repair",
    name: "Təmir və Texniki Xidmət",
    code: "REP",
    color: "#b45309",
    icon: "Wrench",
    orgLevel: "DEPARTMENT_HEAD",
    parentKey: "logistics",
    description: "Təmir, diagnostika və avtoyuma",
  },
  {
    key: "international",
    name: "Beynəlxalq Daşıma",
    code: "INT",
    color: "#0284c7",
    icon: "Globe",
    orgLevel: "DEPARTMENT_HEAD",
    description: "Multimodal, quru, dəmir yolu, hava və dəniz daşımaları",
  },
  {
    key: "int_multimodal",
    name: "Multimodal Daşımalar",
    code: "INT-MM",
    color: "#0ea5e9",
    icon: "Boxes",
    orgLevel: "SECTION_HEAD",
    parentKey: "international",
    description: "Multimodal daşımalar bölməsi",
  },
  {
    key: "int_road",
    name: "Quru Daşımaları",
    code: "INT-RD",
    color: "#38bdf8",
    icon: "Truck",
    orgLevel: "SECTION_HEAD",
    parentKey: "international",
    description: "Quru (avtomobil) daşımaları bölməsi",
  },
  {
    key: "int_rail",
    name: "Dəmir Yolu Daşımaları",
    code: "INT-RL",
    color: "#7dd3fc",
    icon: "TrainFront",
    orgLevel: "SECTION_HEAD",
    parentKey: "international",
    description: "Dəmir yolu daşımaları bölməsi",
  },
  {
    key: "int_air",
    name: "Hava Daşımaları",
    code: "INT-AIR",
    color: "#0369a1",
    icon: "Plane",
    orgLevel: "SECTION_HEAD",
    parentKey: "international",
    description: "Hava daşımaları bölməsi",
  },
  {
    key: "int_sea",
    name: "Dəniz Daşımaları",
    code: "INT-SEA",
    color: "#075985",
    icon: "Ship",
    orgLevel: "SECTION_HEAD",
    parentKey: "international",
    description: "Dəniz daşımaları bölməsi",
  },
];

const F = "founder@mtrans.com";
const CEO = "m.babayev@m-trans.az";

function intlSection(
  deptKey: OrgDeptKey,
  headEmail: string,
  people: [string, string, string, OrgLevel][]
): OrgPersonDef[] {
  return people.map(([email, name, jobTitle, orgLevel], idx) => ({
    email,
    name,
    jobTitle,
    deptKey,
    orgLevel,
    roleKey: "international" as const,
    reportsToEmail: idx === 0 ? "zaur.mammadov@m-trans.az" : headEmail,
    headOfDeptKey: idx === 0 ? deptKey : undefined,
  }));
}

export const ORG_PEOPLE: OrgPersonDef[] = [
  // --- Müşahidə və İdarə Heyəti ---
  {
    email: F,
    name: "Elvin Rəsulov",
    jobTitle: "Təsisçi — Müşahidə və İdarə heyətinin sədri",
    deptKey: "board",
    orgLevel: "SUPERVISORY_BOARD",
    roleKey: "founder",
    isFounder: true,
    protected: true,
    headOfDeptKey: "board",
  },
  {
    email: "admin@demo.com",
    name: "Orxan Cəfərov",
    jobTitle: "Super Admin",
    deptKey: "board",
    orgLevel: "EXECUTIVE_BOARD",
    roleKey: "super_admin",
    reportsToEmail: F,
    protected: true,
  },
  {
    email: CEO,
    name: "M. Babayev",
    jobTitle: "İcraçı Direktor (CEO)",
    deptKey: "board",
    orgLevel: "EXECUTIVE_BOARD",
    roleKey: "executive",
    reportsToEmail: F,
    protected: true,
  },
  {
    email: "gunel.hasanova@m-trans.az",
    name: "Günel Həsənova",
    jobTitle: "Maliyyə Direktoru (CFO)",
    deptKey: "board",
    orgLevel: "EXECUTIVE_BOARD",
    roleKey: "executive",
    reportsToEmail: F,
  },
  {
    email: "nicat.quliyev@m-trans.az",
    name: "Nicat Quliyev",
    jobTitle: "Logistika Əməliyyatları üzrə Direktor (COO)",
    deptKey: "board",
    orgLevel: "EXECUTIVE_BOARD",
    roleKey: "executive",
    reportsToEmail: F,
    headOfDeptKey: "logistics",
  },

  // --- Data və Rəqəmsal Transformasiya ---
  {
    email: "tural.aliyev@m-trans.az",
    name: "Tural Əliyev",
    jobTitle: "Şöbə müdiri",
    deptKey: "data",
    orgLevel: "DEPARTMENT_HEAD",
    roleKey: "data",
    reportsToEmail: CEO,
    headOfDeptKey: "data",
  },
  {
    email: "aysel.mammadova@m-trans.az",
    name: "Aysel Məmmədova",
    jobTitle: "Data Science və Biznesə Nəzarət Bölmə müdiri",
    deptKey: "data",
    orgLevel: "SECTION_HEAD",
    roleKey: "data",
    reportsToEmail: "tural.aliyev@m-trans.az",
  },
  {
    email: "rauf.huseynov@m-trans.az",
    name: "Rauf Hüseynov",
    jobTitle: "Data Scientist",
    deptKey: "data",
    orgLevel: "SPECIALIST",
    roleKey: "data",
    reportsToEmail: "aysel.mammadova@m-trans.az",
  },
  {
    email: "nergiz.qasimova@m-trans.az",
    name: "Nərgiz Qasımova",
    jobTitle: "Biznes Performans və KPI idarəetmə üzrə mütəxəssis",
    deptKey: "data",
    orgLevel: "SPECIALIST",
    roleKey: "data",
    reportsToEmail: "aysel.mammadova@m-trans.az",
  },
  {
    email: "kamran.ismayilov@m-trans.az",
    name: "Kamran İsmayılov",
    jobTitle: "Layihələrin idarə olunması üzrə mütəxəssis",
    deptKey: "data",
    orgLevel: "SPECIALIST",
    roleKey: "data",
    reportsToEmail: "tural.aliyev@m-trans.az",
  },

  // --- Hüquq və Audit ---
  {
    email: "farid.valiyev@m-trans.az",
    name: "Fərid Vəliyev",
    jobTitle: "Hüquqşünas",
    deptKey: "legal",
    orgLevel: "DEPARTMENT_HEAD",
    roleKey: "legal",
    reportsToEmail: CEO,
    headOfDeptKey: "legal",
  },
  {
    email: "leman.ahmadova@m-trans.az",
    name: "Ləman Əhmədova",
    jobTitle: "Müqavilələr üzrə mütəxəssis",
    deptKey: "legal",
    orgLevel: "SPECIALIST",
    roleKey: "legal",
    reportsToEmail: "farid.valiyev@m-trans.az",
  },
  {
    email: "senan.mustafayev@m-trans.az",
    name: "Sənan Mustafayev",
    jobTitle: "Müşahidə şurasının audit rəhbəri",
    deptKey: "legal",
    orgLevel: "SECTION_HEAD",
    roleKey: "legal",
    reportsToEmail: F,
  },
  {
    email: "ulviyya.jafarova@m-trans.az",
    name: "Ülviyyə Cəfərova",
    jobTitle: "Daxili audit mütəxəssisi",
    deptKey: "legal",
    orgLevel: "SPECIALIST",
    roleKey: "legal",
    reportsToEmail: "senan.mustafayev@m-trans.az",
  },

  // --- İT ---
  {
    email: "elchin.rzayev@m-trans.az",
    name: "Elçin Rzayev",
    jobTitle: "İT bölmə müdiri",
    deptKey: "it",
    orgLevel: "SECTION_HEAD",
    roleKey: "it",
    reportsToEmail: CEO,
    headOfDeptKey: "it",
  },
  {
    email: "orkhan.babayev@m-trans.az",
    name: "Orxan Babayev",
    jobTitle: "İT dəstək (Helpdesk)",
    deptKey: "it",
    orgLevel: "SPECIALIST",
    roleKey: "it",
    reportsToEmail: "elchin.rzayev@m-trans.az",
  },
  {
    email: "samira.nasirova@m-trans.az",
    name: "Samirə Nəsirova",
    jobTitle: "Sistem Təhlükəsizliyi mütəxəssisi",
    deptKey: "it",
    orgLevel: "SPECIALIST",
    roleKey: "it",
    reportsToEmail: "elchin.rzayev@m-trans.az",
  },

  // --- Marketinq və Satış ---
  {
    email: "sevinc.aliyeva@m-trans.az",
    name: "Sevinc Əliyeva",
    jobTitle: "Marketinq və Satış bölmə müdiri",
    deptKey: "marketing",
    orgLevel: "SECTION_HEAD",
    roleKey: "marketing_head",
    reportsToEmail: CEO,
    headOfDeptKey: "marketing",
  },
  {
    email: "emin.quliyev@m-trans.az",
    name: "Emin Quliyev",
    jobTitle: "Satış qrup rəhbəri",
    deptKey: "marketing",
    orgLevel: "GROUP_LEAD",
    roleKey: "marketing",
    reportsToEmail: "sevinc.aliyeva@m-trans.az",
  },
  {
    email: "nigar.hasanli@m-trans.az",
    name: "Nigar Həsənli",
    jobTitle: "Sales Executive",
    deptKey: "marketing",
    orgLevel: "SPECIALIST",
    roleKey: "marketing",
    reportsToEmail: "emin.quliyev@m-trans.az",
  },
  {
    email: "tunar.mammadli@m-trans.az",
    name: "Tunar Məmmədli",
    jobTitle: "Tender/Rəqib analizi mütəxəssisi",
    deptKey: "marketing",
    orgLevel: "SPECIALIST",
    roleKey: "marketing",
    reportsToEmail: "sevinc.aliyeva@m-trans.az",
  },
  {
    email: "aytac.ibrahimova@m-trans.az",
    name: "Aytac İbrahimova",
    jobTitle: "Brand və Digital Marketinq mütəxəssisi",
    deptKey: "marketing",
    orgLevel: "SPECIALIST",
    roleKey: "marketing",
    reportsToEmail: "sevinc.aliyeva@m-trans.az",
  },

  // --- HR ---
  {
    email: "konul.aliyeva@m-trans.az",
    name: "Könül Əliyeva",
    jobTitle: "Şöbə müdiri",
    deptKey: "hr",
    orgLevel: "DEPARTMENT_HEAD",
    roleKey: "hr",
    reportsToEmail: CEO,
    headOfDeptKey: "hr",
  },
  {
    email: "vusala.huseynova@m-trans.az",
    name: "Vüsalə Hüseynova",
    jobTitle: "HR Bölmə müdiri",
    deptKey: "hr",
    orgLevel: "SECTION_HEAD",
    roleKey: "hr",
    reportsToEmail: "konul.aliyeva@m-trans.az",
  },
  {
    email: "rashad.najafov@m-trans.az",
    name: "Rəşad Nəcəfov",
    jobTitle: "HR Generalist",
    deptKey: "hr",
    orgLevel: "SPECIALIST",
    roleKey: "hr",
    reportsToEmail: "vusala.huseynova@m-trans.az",
  },
  {
    email: "elvin.qasimov@m-trans.az",
    name: "Elvin Qasımov",
    jobTitle: "İnzibati və Təsərrüfat qrup rəhbəri",
    deptKey: "hr",
    orgLevel: "GROUP_LEAD",
    roleKey: "hr",
    reportsToEmail: "konul.aliyeva@m-trans.az",
  },
  {
    email: "mehriban.safarova@m-trans.az",
    name: "Mehriban Səfərova",
    jobTitle: "Ofis Administratoru",
    deptKey: "hr",
    orgLevel: "SPECIALIST",
    roleKey: "hr",
    reportsToEmail: "elvin.qasimov@m-trans.az",
  },
  {
    email: "anar.mammadov@m-trans.az",
    name: "Anar Məmmədov",
    jobTitle: "SƏTƏM mütəxəssisi",
    deptKey: "hr",
    orgLevel: "SPECIALIST",
    roleKey: "hr",
    reportsToEmail: "elvin.qasimov@m-trans.az",
  },

  // --- Maliyyə ---
  {
    email: "shahla.quliyeva@m-trans.az",
    name: "Şəhla Quliyeva",
    jobTitle: "Baş Maliyyə Mütəxəssisi",
    deptKey: "finance",
    orgLevel: "DEPARTMENT_HEAD",
    roleKey: "finance",
    reportsToEmail: "gunel.hasanova@m-trans.az",
    headOfDeptKey: "finance",
  },
  {
    email: "ilkin.alizade@m-trans.az",
    name: "İlkin Əlizadə",
    jobTitle: "Finance Specialist I",
    deptKey: "finance",
    orgLevel: "SPECIALIST",
    roleKey: "finance",
    reportsToEmail: "shahla.quliyeva@m-trans.az",
  },
  {
    email: "fidan.mammadova@m-trans.az",
    name: "Fidan Məmmədova",
    jobTitle: "Finance Specialist II",
    deptKey: "finance",
    orgLevel: "SPECIALIST",
    roleKey: "finance",
    reportsToEmail: "shahla.quliyeva@m-trans.az",
  },
  {
    email: "ramiz.hasanov@m-trans.az",
    name: "Ramiz Həsənov",
    jobTitle: "Baş Mühasib",
    deptKey: "finance",
    orgLevel: "SECTION_HEAD",
    roleKey: "finance",
    reportsToEmail: "shahla.quliyeva@m-trans.az",
  },
  {
    email: "gunay.aliyeva@m-trans.az",
    name: "Günay Əliyeva",
    jobTitle: "Mühasib I",
    deptKey: "finance",
    orgLevel: "SPECIALIST",
    roleKey: "finance",
    reportsToEmail: "ramiz.hasanov@m-trans.az",
  },
  {
    email: "tahmina.qasimova@m-trans.az",
    name: "Təhminə Qasımova",
    jobTitle: "Mühasib II",
    deptKey: "finance",
    orgLevel: "SPECIALIST",
    roleKey: "finance",
    reportsToEmail: "ramiz.hasanov@m-trans.az",
  },
  {
    email: "elnur.abbasov@m-trans.az",
    name: "Elnur Abbasov",
    jobTitle: "Kassa üzrə mütəxəssis",
    deptKey: "finance",
    orgLevel: "SPECIALIST",
    roleKey: "finance",
    reportsToEmail: "ramiz.hasanov@m-trans.az",
  },
  {
    email: "aygun.rahimova@m-trans.az",
    name: "Aygün Rəhimova",
    jobTitle: "Kassa üzrə mütəxəssis",
    deptKey: "finance",
    orgLevel: "SPECIALIST",
    roleKey: "finance",
    reportsToEmail: "ramiz.hasanov@m-trans.az",
  },

  // --- Nəqliyyat Planlama ---
  {
    email: "rauf.aliyev@m-trans.az",
    name: "Rauf Əliyev",
    jobTitle: "Nəqliyyat Planlama Şöbə Müdiri",
    deptKey: "transport",
    orgLevel: "DEPARTMENT_HEAD",
    roleKey: "logistics",
    reportsToEmail: "nicat.quliyev@m-trans.az",
    headOfDeptKey: "transport",
  },
  {
    email: "cavid.huseynov@m-trans.az",
    name: "Cavid Hüseynov",
    jobTitle: "Nəqliyyat təminatı mütəxəssisi",
    deptKey: "transport",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "rauf.aliyev@m-trans.az",
  },
  {
    email: "nurlan.ismayilov@m-trans.az",
    name: "Nurlan İsmayılov",
    jobTitle: "Sistem operatoru",
    deptKey: "transport",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "rauf.aliyev@m-trans.az",
  },
  {
    email: "sabina.mammadova@m-trans.az",
    name: "Səbinə Məmmədova",
    jobTitle: "Sənədləşmə mütəxəssisi",
    deptKey: "transport",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "rauf.aliyev@m-trans.az",
  },
  {
    email: "elshan.quliyev@m-trans.az",
    name: "Elşən Quliyev",
    jobTitle: "İstismar qrup rəhbəri",
    deptKey: "transport",
    orgLevel: "GROUP_LEAD",
    roleKey: "logistics",
    reportsToEmail: "rauf.aliyev@m-trans.az",
  },
  {
    email: "vuqar.ahmadov@m-trans.az",
    name: "Vüqar Əhmədov",
    jobTitle: "İstismar Mexaniki",
    deptKey: "transport",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "elshan.quliyev@m-trans.az",
  },
  {
    email: "rashad.mammadov@m-trans.az",
    name: "Rəşad Məmmədov",
    jobTitle: "Yük avtomobil sürücüsü",
    deptKey: "transport",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "elshan.quliyev@m-trans.az",
  },
  {
    email: "kamal.hasanov@m-trans.az",
    name: "Kamal Həsənov",
    jobTitle: "Yük avtomobil sürücüsü",
    deptKey: "transport",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "elshan.quliyev@m-trans.az",
  },
  {
    email: "tural.jafarov@m-trans.az",
    name: "Tural Cəfərov",
    jobTitle: "Yük avtomobil sürücüsü",
    deptKey: "transport",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "elshan.quliyev@m-trans.az",
  },

  // --- Təmir ---
  {
    email: "ali.qasimov@m-trans.az",
    name: "Əli Qasımov",
    jobTitle: "Təmir və Texniki Xidmət Şöbə Müdiri",
    deptKey: "repair",
    orgLevel: "DEPARTMENT_HEAD",
    roleKey: "logistics",
    reportsToEmail: "nicat.quliyev@m-trans.az",
    headOfDeptKey: "repair",
  },
  {
    email: "murad.nasirov@m-trans.az",
    name: "Murad Nəsirov",
    jobTitle: "Təmir qrup rəhbəri",
    deptKey: "repair",
    orgLevel: "GROUP_LEAD",
    roleKey: "logistics",
    reportsToEmail: "ali.qasimov@m-trans.az",
  },
  {
    email: "leyla.aliyeva@m-trans.az",
    name: "Leyla Əliyeva",
    jobTitle: "Təmir Qəbulu Koordinatoru",
    deptKey: "repair",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "murad.nasirov@m-trans.az",
  },
  {
    email: "sabuhi.mammadov@m-trans.az",
    name: "Səbuhi Məmmədov",
    jobTitle: "Usta",
    deptKey: "repair",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "murad.nasirov@m-trans.az",
  },
  {
    email: "elvin.huseynov@m-trans.az",
    name: "Elvin Hüseynov",
    jobTitle: "Usta",
    deptKey: "repair",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "murad.nasirov@m-trans.az",
  },
  {
    email: "ramin.quliyev@m-trans.az",
    name: "Ramin Quliyev",
    jobTitle: "Usta",
    deptKey: "repair",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "murad.nasirov@m-trans.az",
  },
  {
    email: "orkhan.aliyev@m-trans.az",
    name: "Orxan Əliyev",
    jobTitle: "Avtoyumaçı",
    deptKey: "repair",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "murad.nasirov@m-trans.az",
  },
  {
    email: "nicat.hasanli@m-trans.az",
    name: "Nicat Həsənli",
    jobTitle: "Avtoyumaçı",
    deptKey: "repair",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "murad.nasirov@m-trans.az",
  },
  {
    email: "farid.ibrahimov@m-trans.az",
    name: "Fərid İbrahimov",
    jobTitle: "Diaqnostika qrup rəhbəri",
    deptKey: "repair",
    orgLevel: "GROUP_LEAD",
    roleKey: "logistics",
    reportsToEmail: "ali.qasimov@m-trans.az",
  },
  {
    email: "aysel.rzayeva@m-trans.az",
    name: "Aysel Rzayeva",
    jobTitle: "Diaqnostika mütəxəssisi",
    deptKey: "repair",
    orgLevel: "SPECIALIST",
    roleKey: "logistics",
    reportsToEmail: "farid.ibrahimov@m-trans.az",
  },

  // --- Beynəlxalq Daşıma ---
  {
    email: "zaur.mammadov@m-trans.az",
    name: "Zaur Məmmədov",
    jobTitle: "Şöbə müdiri",
    deptKey: "international",
    orgLevel: "DEPARTMENT_HEAD",
    roleKey: "international",
    reportsToEmail: "nicat.quliyev@m-trans.az",
    headOfDeptKey: "international",
  },
  ...intlSection("int_multimodal", "aygun.aliyeva@m-trans.az", [
    ["aygun.aliyeva@m-trans.az", "Aygün Əliyeva", "Multimodal daşımaları üzrə bölmə müdiri", "SECTION_HEAD"],
    ["elvin.nabiyev@m-trans.az", "Elvin Nəbiyev", "Qiymətləndirmə və Təklif mütəxəssisi (Pricing)", "SPECIALIST"],
    ["narmin.hasanova@m-trans.az", "Nərmin Həsənova", "Daşıma mütəxəssisi", "SPECIALIST"],
    ["rashad.quliyev@m-trans.az", "Rəşad Quliyev", "Sistem operatoru", "SPECIALIST"],
  ]),
  ...intlSection("int_road", "tural.ismayilov@m-trans.az", [
    ["tural.ismayilov@m-trans.az", "Tural İsmayılov", "Quru daşımaları üzrə bölmə müdiri", "SECTION_HEAD"],
    ["sevda.mammadova@m-trans.az", "Sevda Məmmədova", "Qiymətləndirmə və Təklif mütəxəssisi (Pricing)", "SPECIALIST"],
    ["kamran.aliyev@m-trans.az", "Kamran Əliyev", "Daşıma mütəxəssisi", "SPECIALIST"],
    ["gunel.rzayeva@m-trans.az", "Günel Rzayeva", "Sistem operatoru", "SPECIALIST"],
  ]),
  ...intlSection("int_rail", "elchin.huseynov@m-trans.az", [
    ["elchin.huseynov@m-trans.az", "Elçin Hüseynov", "Dəmir yolu daşımaları üzrə bölmə müdiri", "SECTION_HEAD"],
    ["nigar.qasimova@m-trans.az", "Nigar Qasımova", "Qiymətləndirmə və Təklif mütəxəssisi (Pricing)", "SPECIALIST"],
    ["orkhan.mammadli@m-trans.az", "Orxan Məmmədli", "Daşıma mütəxəssisi", "SPECIALIST"],
    ["leman.aliyeva@m-trans.az", "Ləman Əliyeva", "Sistem operatoru", "SPECIALIST"],
  ]),
  ...intlSection("int_air", "rauf.abdullayev@m-trans.az", [
    ["rauf.abdullayev@m-trans.az", "Rauf Abdullayev", "Hava daşımaları üzrə bölmə müdiri", "SECTION_HEAD"],
    ["aysel.jafarova@m-trans.az", "Aysel Cəfərova", "Qiymətləndirmə və Təklif mütəxəssisi (Pricing)", "SPECIALIST"],
    ["emin.valiyev@m-trans.az", "Emin Vəliyev", "Daşıma mütəxəssisi", "SPECIALIST"],
    ["fidan.hasanli@m-trans.az", "Fidan Həsənli", "Sistem operatoru", "SPECIALIST"],
  ]),
  ...intlSection("int_sea", "sanan.aliyev@m-trans.az", [
    ["sanan.aliyev@m-trans.az", "Sənan Əliyev", "Dəniz daşımaları üzrə bölmə müdiri", "SECTION_HEAD"],
    ["mehriban.quliyeva@m-trans.az", "Mehriban Quliyeva", "Qiymətləndirmə və Təklif mütəxəssisi (Pricing)", "SPECIALIST"],
    ["vusal.mammadov@m-trans.az", "Vüsal Məmmədov", "Daşıma mütəxəssisi", "SPECIALIST"],
    ["tunar.huseynov@m-trans.az", "Tunar Hüseynov", "Sistem operatoru", "SPECIALIST"],
  ]),
];

const WORK: PermissionKey[] = [
  "CAN_VIEW_DEPARTMENTS",
  "CAN_VIEW_ROLES",
  "CAN_VIEW_PROJECT",
  "CAN_CREATE_TASK",
  "CAN_EDIT_TASK",
  "CAN_VIEW_TASK",
  "CAN_CHANGE_TASK_STATUS",
  "CAN_CREATE_SUBTASK",
  "CAN_EDIT_SUBTASK",
  "CAN_COMPLETE_SUBTASK",
  "CAN_COMMENT",
  "CAN_EDIT_OWN_COMMENT",
  "CAN_DELETE_OWN_COMMENT",
  "CAN_UPLOAD_FILE",
  "CAN_DELETE_OWN_FILE",
  "CAN_VIEW_FILES",
];

const HEAD: PermissionKey[] = [
  ...WORK,
  "CAN_INVITE_USER",
  "CAN_ASSIGN_DEPARTMENT",
  "CAN_CREATE_PROJECT",
  "CAN_EDIT_PROJECT",
  "CAN_ASSIGN_PROJECT_MEMBER",
  "CAN_ASSIGN_TASK",
  "CAN_SET_TASK_PRIORITY",
  "CAN_SET_TASK_DEADLINE",
  "CAN_DELETE_TASK",
];

export const ORG_ROLE_META: Record<
  OrgRoleKey,
  { name: string; description: string; color: string; isSystem?: boolean; isDefault?: boolean }
> = {
  founder: {
    name: "Founder",
    description: "Təsisçi — bütün icazələr. Super Admin silə və ya yetkisini ala bilməz.",
    color: "#7c3aed",
    isSystem: true,
  },
  super_admin: {
    name: "Super Admin",
    description: "Sistem administratoru — tam giriş (Təsisçi istisna olmaqla)",
    color: "#ef4444",
    isSystem: true,
  },
  executive: {
    name: "İdarə Heyəti",
    description: "CEO / CFO / COO — modul idarəetməsi",
    color: "#2563eb",
    isSystem: true,
  },
  data: {
    name: "Data və Transformasiya",
    description: "Data, KPI və layihə idarəetməsi",
    color: "#0891b2",
    isSystem: true,
  },
  legal: {
    name: "Hüquq və Audit",
    description: "Hüquq və daxili audit",
    color: "#475569",
    isSystem: true,
  },
  it: {
    name: "İT",
    description: "İT dəstək və təhlükəsizlik",
    color: "#6366f1",
    isSystem: true,
  },
  marketing_head: {
    name: "Marketinq rəhbəri",
    description: "Marketinq CRUD; Anbar və Maliyyə — yalnız baxış",
    color: "#db2777",
    isSystem: true,
  },
  marketing: {
    name: "Marketinq mütəxəssisi",
    description: "Marketinq CRUD; Anbar və Maliyyə — giriş yoxdur",
    color: "#ec4899",
    isSystem: true,
  },
  hr: {
    name: "HR və İnzibati",
    description: "İnsan resursları və inzibati işlər",
    color: "#8b5cf6",
    isSystem: true,
  },
  finance: {
    name: "Maliyyə",
    description: "Maliyyə CRUD; Anbar — yalnız baxış",
    color: "#059669",
    isSystem: true,
  },
  logistics: {
    name: "Logistika",
    description: "Nəqliyyat, təmir və anbar (WMS)",
    color: "#d97706",
    isSystem: true,
  },
  international: {
    name: "Beynəlxalq Daşıma",
    description: "Beynəlxalq daşıma əməliyyatları",
    color: "#0284c7",
    isSystem: true,
  },
  specialist: {
    name: "Mütəxəssis",
    description: "Standart işçi — baza tapşırıq icazələri",
    color: "#64748b",
    isSystem: true,
    isDefault: true,
  },
};

export const MODULE_PERMISSIONS: { key: PermissionKey; name: string; description: string; category: string }[] = [
  { key: "CAN_MANAGE_MARKETING", name: "Marketinqi idarə et", description: "Marketinq kampaniyalarında CRUD", category: "MARKETING" },
  { key: "CAN_VIEW_MARKETING", name: "Marketinqə bax", description: "Marketinq moduluna yalnız baxış", category: "MARKETING" },
  { key: "CAN_MANAGE_FINANCE", name: "Maliyyəni idarə et", description: "Maliyyə məlumatlarında CRUD", category: "FINANCE" },
  { key: "CAN_VIEW_FINANCE", name: "Maliyyəyə bax", description: "Maliyyə moduluna yalnız baxış", category: "FINANCE" },
  { key: "CAN_MANAGE_WMS", name: "Anbarı idarə et", description: "WMS-də CRUD (məhsul, stok, anbar)", category: "WMS" },
  { key: "CAN_VIEW_WMS", name: "Anbara bax", description: "WMS-ə yalnız baxış", category: "WMS" },
  { key: "CAN_MANAGE_CRM", name: "CRM-i idarə et", description: "CRM-də CRUD", category: "CRM" },
  { key: "CAN_VIEW_CRM", name: "CRM-ə bax", description: "CRM-ə yalnız baxış", category: "CRM" },
  { key: "CAN_MANAGE_HR", name: "HR-i idarə et", description: "HR modulunda CRUD", category: "HR" },
  { key: "CAN_VIEW_HR", name: "HR-ə bax", description: "HR-ə yalnız baxış", category: "HR" },
  { key: "CAN_MANAGE_LEGAL", name: "Hüququ idarə et", description: "Hüquq və audit modulunda CRUD", category: "LEGAL" },
  { key: "CAN_VIEW_LEGAL", name: "Hüquqa bax", description: "Hüquq moduluna yalnız baxış", category: "LEGAL" },
  { key: "CAN_MANAGE_IT", name: "İT-ni idarə et", description: "İT modulunda CRUD", category: "IT" },
  { key: "CAN_VIEW_IT", name: "İT-yə bax", description: "İT-yə yalnız baxış", category: "IT" },
  { key: "CAN_MANAGE_DATA", name: "Data-nı idarə et", description: "Data və transformasiya modulunda CRUD", category: "DATA" },
  { key: "CAN_VIEW_DATA", name: "Data-ya bax", description: "Data moduluna yalnız baxış", category: "DATA" },
  { key: "CAN_MANAGE_LOGISTICS", name: "Logistikanı idarə et", description: "Logistika modulunda CRUD", category: "LOGISTICS" },
  { key: "CAN_VIEW_LOGISTICS", name: "Logistikaya bax", description: "Logistikaya yalnız baxış", category: "LOGISTICS" },
  { key: "CAN_MANAGE_INTERNATIONAL", name: "Beynəlxalq daşımanı idarə et", description: "Beynəlxalq daşımada CRUD", category: "INTERNATIONAL" },
  { key: "CAN_VIEW_INTERNATIONAL", name: "Beynəlxalq daşımaya bax", description: "Beynəlxalq daşımaya yalnız baxış", category: "INTERNATIONAL" },
];

export function permissionsForRole(roleKey: OrgRoleKey, allKeys: PermissionKey[]): PermissionKey[] {
  switch (roleKey) {
    case "founder":
    case "super_admin":
      return allKeys;
    case "executive":
      return allKeys.filter((k) => k !== "CAN_MANAGE_COMPANY" && k !== "CAN_MANAGE_BILLING");
    case "marketing":
      return [
        ...HEAD.filter((k) => k !== "CAN_INVITE_USER" && k !== "CAN_ASSIGN_DEPARTMENT"),
        "CAN_MANAGE_MARKETING",
        "CAN_VIEW_MARKETING",
        "CAN_VIEW_CRM",
      ];
    case "marketing_head":
      return [
        ...HEAD,
        "CAN_MANAGE_MARKETING",
        "CAN_VIEW_MARKETING",
        "CAN_VIEW_CRM",
        "CAN_MANAGE_CRM",
        "CAN_VIEW_WMS",
        "CAN_VIEW_FINANCE",
      ];
    case "finance":
      return [
        ...HEAD,
        "CAN_MANAGE_FINANCE",
        "CAN_VIEW_FINANCE",
        "CAN_VIEW_REPORTS",
        "CAN_EXPORT_DATA",
        "CAN_VIEW_WMS",
      ];
    case "logistics":
      return [
        ...HEAD,
        "CAN_MANAGE_LOGISTICS",
        "CAN_VIEW_LOGISTICS",
        "CAN_MANAGE_WMS",
        "CAN_VIEW_WMS",
      ];
    case "international":
      return [
        ...HEAD,
        "CAN_MANAGE_INTERNATIONAL",
        "CAN_VIEW_INTERNATIONAL",
        "CAN_VIEW_CRM",
        "CAN_VIEW_LOGISTICS",
      ];
    case "data":
      return [...HEAD, "CAN_MANAGE_DATA", "CAN_VIEW_DATA", "CAN_VIEW_REPORTS"];
    case "legal":
      return [...HEAD, "CAN_MANAGE_LEGAL", "CAN_VIEW_LEGAL", "CAN_VIEW_AUDIT_LOG"];
    case "it":
      return [...HEAD, "CAN_MANAGE_IT", "CAN_VIEW_IT"];
    case "hr":
      return [...HEAD, "CAN_MANAGE_HR", "CAN_VIEW_HR", "CAN_INVITE_USER", "CAN_ASSIGN_DEPARTMENT"];
    case "specialist":
    default:
      return WORK;
  }
}

export function getLoginDirectory() {
  const byKey = new Map(ORG_DEPARTMENTS.map((d) => [d.key, d]));
  const childKeys = (parent: OrgDeptKey): OrgDeptKey[] => {
    const keys: OrgDeptKey[] = [parent];
    for (const d of ORG_DEPARTMENTS) {
      if (d.parentKey === parent) keys.push(...childKeys(d.key));
    }
    return keys;
  };

  return ORG_DEPARTMENTS.filter((d) => !d.parentKey).map((dept) => {
    const tree = new Set(childKeys(dept.key));
    const people = ORG_PEOPLE.filter((p) => tree.has(p.deptKey)).map((p) => ({
      name: p.name,
      email: p.email,
      jobTitle: p.jobTitle,
      orgLevel: p.orgLevel,
      password: DEMO_PASSWORD,
    }));
    return {
      key: dept.key,
      name: dept.name,
      color: dept.color,
      people,
    };
  });
}
