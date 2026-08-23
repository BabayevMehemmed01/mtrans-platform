"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react"; // YENİ: Sessiya üçün
import { getTranslation } from "@/lib/i18n";  // YENİ: Tərcümə mühərriki
import { cn } from "@/lib/utils";
import {
  useColorTheme,
  COLOR_THEME_IDS,
  type ColorThemeId,
} from "@/components/providers/ColorThemeProvider";
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Check, 
  FolderKanban, 
  KeyRound, 
  Palette, 
  Bell, 
  Globe, 
  Smartphone, 
  Moon, 
  Sun,
  Image as ImageIcon,
  Lock,
  LogOut
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- TİPLƏR ---
type CompanyInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  taxId?: string | null;
  plan: string;
  createdAt: Date;
  defaultProjectIds: string[];
  defaultMemberRoleId?: string | null;
  defaultGuestRoleId?: string | null;
};

type UserSettings = {
  id: string;
  theme: string;
  language: string;
  wallpaper: string;
};

type Permission = {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
};

type ProjectOption = {
  id: string;
  name: string;
  color: string;
};

// --- KÖMƏKÇİ FUNKSİYALAR ---
function groupByCategory(permissions: Permission[]) {
  return permissions.reduce((acc: Record<string, Permission[]>, p) => {
    const cat = p.category || "GENERAL";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});
}

const CATEGORY_LABELS: Record<string, string> = {
  COMPANY: "🏢 Şirkət İdarəetməsi",
  ROLE: "🔐 Rol & İcazə",
  DEPARTMENT: "🏬 Şöbə",
  PROJECT: "📁 Layihə",
  TASK: "✅ Tapşırıq",
  SUBTASK: "📋 Alt Tapşırıq",
  COMMENT: "💬 Şərhlər",
  FILE: "📎 Fayllar",
  REPORT: "📊 Hesabatlar",
  REPORTING: "📊 Hesabatlar",
};

// --- RƏNG TEMALARI (Color Themes) ---
// 8 premium rəng teması: hər biri üçün önizləmə rəngi (swatch) və tərcümə açarı.
// Faktiki tətbiq globals.css-dəki `[data-color-theme="..."]` CSS dəyişənləri
// vasitəsilə ColorThemeProvider tərəfindən idarə olunur.
const SETTINGS_TAB_TRIGGER_CLASS =
  "group/tab justify-start gap-0 px-3 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:-translate-y-0.5 transition-all text-[14px] font-bold text-muted-foreground bg-card border border-border shadow-sm hover:border-primary/40 hover:text-foreground hover:shadow-sm";

const SETTINGS_TAB_ICON_CLASS =
  "flex items-center justify-center size-8 rounded-lg mr-3 bg-muted text-muted-foreground transition-colors group-data-[state=active]/tab:bg-primary-foreground/15 group-data-[state=active]/tab:text-primary-foreground group-hover/tab:text-foreground";

const SETTINGS_PANEL_CLASS =
  "mt-0 border border-border rounded-2xl bg-card p-6 md:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200";

const SETTINGS_HEADING_CLASS =
  "text-xl font-black mb-6 text-foreground border-b border-border pb-4";

const SETTINGS_LABEL_CLASS = "text-[13px] font-bold text-muted-foreground uppercase tracking-wider";
const SETTINGS_LABEL_SM_CLASS = "text-[12px] font-bold text-muted-foreground uppercase tracking-wider";
const SETTINGS_SELECT_CLASS =
  "w-full h-12 px-4 rounded-xl border border-input bg-muted text-[14px] font-bold text-foreground focus:border-primary focus:bg-background outline-none transition-all cursor-pointer";

const COLOR_THEMES: { id: ColorThemeId; swatch: string; labelKey: string }[] = [
  { id: "default", swatch: "#4f46e5", labelKey: "default" },
  { id: "blue", swatch: "#2563eb", labelKey: "blue" },
  { id: "purple", swatch: "#7c3aed", labelKey: "purple" },
  { id: "green", swatch: "#059669", labelKey: "green" },
  { id: "rose", swatch: "#e11d48", labelKey: "rose" },
  { id: "orange", swatch: "#ea580c", labelKey: "orange" },
  { id: "slate", swatch: "#475569", labelKey: "slate" },
  { id: "zinc", swatch: "#3f3f46", labelKey: "zinc" },
];

// --- ALT KOMPONENTLƏR ---
// YENİ: Tərcümə funksiyasını bura props kimi ötürürük
function PermissionCheckboxGroup({ permissions, selected, onChange, t }: { permissions: Permission[]; selected: string[]; onChange: (ids: string[]) => void; t: (k: string) => string; }) {
  const grouped = groupByCategory(permissions);

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  const toggleCategory = (catPerms: Permission[]) => {
    const catIds = catPerms.map((p) => p.id);
    const allSelected = catIds.every((id) => selected.includes(id));
    if (allSelected) onChange(selected.filter((s) => !catIds.includes(s)));
    else onChange([...new Set([...selected, ...catIds])]);
  };

  return (
    <div className="space-y-6 max-h-[420px] overflow-y-auto pr-3 custom-scrollbar">
      {Object.entries(grouped).map(([cat, perms]) => {
        const catIds = perms.map((p) => p.id);
        const allChecked = catIds.every((id) => selected.includes(id));
        const someChecked = catIds.some((id) => selected.includes(id));
        
        // Kateqoriyaların da tərcüməsi yoxlanılır (Məs: settings.categories.COMPANY)
        const catLabel = t(`settings.categories.${cat}`) !== `settings.categories.${cat}` ? t(`settings.categories.${cat}`) : CATEGORY_LABELS[cat] || cat;

        return (
          <div key={cat} className="bg-muted/50 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-3 cursor-pointer group" onClick={() => toggleCategory(perms)}>
              <Checkbox
                checked={allChecked ? true : someChecked ? "indeterminate" : false}
                className="pointer-events-none size-5 rounded-md"
              />
              <span className="text-[14px] font-bold text-foreground">{catLabel}</span>
              <span className="text-xs font-bold text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border ml-auto">
                {catIds.filter((id) => selected.includes(id)).length} / {catIds.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
              {perms.map((p) => (
                <label key={p.id} className="flex items-center gap-3 py-1.5 cursor-pointer group rounded-lg hover:bg-card hover:shadow-sm px-2 transition-all">
                  <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                  <span className="text-[13px] font-medium text-muted-foreground">{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectCheckboxList({ projects, selected, onChange }: { projects: ProjectOption[]; selected: string[]; onChange: (ids: string[]) => void; }) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      {projects.map((project) => (
        <label key={project.id} className="flex items-center gap-3 py-2 cursor-pointer group rounded-xl border border-border bg-muted/50 hover:bg-card hover:border-primary/40 hover:shadow-sm px-3 transition-all">
          <Checkbox checked={selected.includes(project.id)} onCheckedChange={() => toggle(project.id)} />
          <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: project.color }} />
          <span className="text-[13px] font-bold text-foreground truncate">{project.name}</span>
        </label>
      ))}
    </div>
  );
}

// --- ƏSAS EXPORT KOMPONENTİ ---
export function SettingsClient({
  initialCompany,
  currentUserSettings,
  roles,
  permissions,
  projects,
  userRole
}: {
  initialCompany: CompanyInfo;
  currentUserSettings: UserSettings | null;
  roles: any[];
  permissions: Permission[];
  projects: ProjectOption[];
  userRole: any;
}) {
  const { setTheme: setSystemTheme } = useTheme();
  const { setColorTheme } = useColorTheme();

  // YENİ: Tərcümə mühərrikini səhifəyə daxil edirik
  const { data: session, update } = useSession();
  const currentLang = (session?.user as any)?.language || "az";
  const t = getTranslation(currentLang);

  const isSuperAdmin = typeof userRole === "string" ? userRole.includes("ADMIN") : (userRole?.name?.toUpperCase().includes("ADMIN") || userRole?.name?.toUpperCase().includes("OWNER"));

  // 1. Görünüş (Appearance) States — bunlar "qaralama" (draft) state-lərdir.
  // "Dəyişiklikləri Tətbiq Et" düyməsi basılana qədər faktiki tema/rəng dəyişmir,
  // yalnız seçilmiş kart vizual olaraq aktivləşir.
  const initialAppearance = useMemo(
    () => ({
      theme: currentUserSettings?.theme || "light",
      language: currentUserSettings?.language || "az",
      colorTheme: ((currentUserSettings?.wallpaper as ColorThemeId) &&
      (COLOR_THEME_IDS as readonly string[]).includes(currentUserSettings?.wallpaper ?? "")
        ? (currentUserSettings?.wallpaper as ColorThemeId)
        : "default") as ColorThemeId,
    }),
    [currentUserSettings]
  );

  const [savedAppearance, setSavedAppearance] = useState(initialAppearance);
  const [theme, setTheme] = useState(initialAppearance.theme);
  const [language, setLanguage] = useState(initialAppearance.language);
  const [colorTheme, setColorThemeDraft] = useState<ColorThemeId>(initialAppearance.colorTheme);

  const isAppearanceDirty =
    theme !== savedAppearance.theme ||
    language !== savedAppearance.language ||
    colorTheme !== savedAppearance.colorTheme;

  // 2. Şirkət (Company) States
  const [companyForm, setCompanyForm] = useState({
    name: initialCompany.name,
    description: initialCompany.description || "",
    website: initialCompany.website || "",
    taxId: initialCompany.taxId || "",
  });

  // 3. Dəvətlər və Rollar (Defaults) States
  const [defaultMemberRoleId, setDefaultMemberRoleId] = useState(initialCompany.defaultMemberRoleId || "");
  const [defaultGuestRoleId, setDefaultGuestRoleId] = useState(initialCompany.defaultGuestRoleId || "");
  const [defaultProjectIds, setDefaultProjectIds] = useState<string[]>(initialCompany.defaultProjectIds || []);
  
  // Permission Template State
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const role of roles) {
      map[role.id] = role.permissions?.map((rp: any) => rp.permission.id) ?? [];
    }
    return map;
  });
  const selectedPermissionIds = rolePermissionsMap[defaultMemberRoleId] ?? [];

  // Loading States
  const [isAppearanceLoading, setIsAppearanceLoading] = useState(false);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const [isDefaultsLoading, setIsDefaultsLoading] = useState(false);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);

  // --- HANDLERS ---
  const handleSaveAppearance = async () => {
    if (!isAppearanceDirty) return;
    setIsAppearanceLoading(true);
    try {
      const res = await fetch("/api/settings/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, language, wallpaper: colorTheme }),
      });
      if (!res.ok) throw new Error(t("settings.error") || "Xəta baş verdi");

      // YENİ: Səhifəni yenidən yükləmədən (reload) — React state/context vasitəsilə
      // dərhal bütün tətbiqə tətbiq edirik.
      setSystemTheme(theme);
      setColorTheme(colorTheme);

      // Dili seçən kimi anında bütün sayta tətbiq olunması üçün sessiyanı yeniləyirik!
      await update({ language });

      // Tətbiq olunan dəyərləri "saxlanılmış" olaraq qeyd edirik — bununla düymə
      // yenidən disabled vəziyyətə düşür, çünki artıq gözləyən dəyişiklik yoxdur.
      setSavedAppearance({ theme, language, colorTheme });

      toast.success(t("settings.appearance.success") || "Görünüş və dil tənzimləmələri yadda saxlanıldı.");
    } catch (err: any) {
      toast.error(err.message || t("settings.error") || "Xəta baş verdi.");
    } finally {
      setIsAppearanceLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim()) return toast.error(t("settings.company.nameRequired") || "Şirkət adı mütləqdir");
    setIsCompanyLoading(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || t("settings.error"));
      toast.success(t("settings.company.success") || "Şirkət profili yeniləndi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const handleSaveDefaults = async () => {
    setIsDefaultsLoading(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          defaultMemberRoleId, 
          defaultGuestRoleId,
          defaultProjectIds 
        }),
      });
      if (!res.ok) throw new Error(t("settings.error") || "Xəta baş verdi");
      toast.success(t("settings.defaults.success") || "Standart dəvət ayarları yeniləndi.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDefaultsLoading(false);
    }
  };

  const handleSavePermissionTemplate = async () => {
    if (!defaultMemberRoleId) return toast.error(t("settings.defaults.selectMemberFirstError") || "Əvvəlcə standart İşçi (Member) rolu seçin");
    setIsPermissionsLoading(true);
    try {
      const res = await fetch(`/api/roles/${defaultMemberRoleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: selectedPermissionIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error || t("settings.error"));
      toast.success(t("settings.defaults.permSuccess") || "İcazə qəlibi (Template) uğurla yeniləndi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPermissionsLoading(false);
    }
  };

  // YENİ: Yazıların yox olmaması üçün hər ehtimala qarşı Default (Fall-back) text-lər qoyulub. 
  // Beləliklə, sən JSON fayllarını yeniləməyi unutsan belə, qabağına boş ekran çıxmayacaq.
  
  return (
    <Tabs defaultValue="appearance" className="flex flex-col md:flex-row gap-8 mt-6">
      
      {/* ─── SOL MENYU (VERTICAL TABS) ─── */}
      <TabsList className="flex flex-col h-auto w-full md:w-64 bg-transparent p-0 gap-2 border-none items-stretch justify-start md:sticky md:top-20 md:self-start">
        <TabsTrigger value="appearance" className={SETTINGS_TAB_TRIGGER_CLASS}>
          <span className={SETTINGS_TAB_ICON_CLASS}><Palette className="w-4 h-4" /></span>
          {t("settings.tabs.appearance") || "Görünüş və Dil"}
        </TabsTrigger>
        
        <TabsTrigger value="defaults" className={SETTINGS_TAB_TRIGGER_CLASS}>
          <span className={SETTINGS_TAB_ICON_CLASS}><Users className="w-4 h-4" /></span>
          {t("settings.tabs.defaults") || "Dəvət Ayarları"}
        </TabsTrigger>

        {isSuperAdmin && (
          <TabsTrigger value="company" className={SETTINGS_TAB_TRIGGER_CLASS}>
            <span className={SETTINGS_TAB_ICON_CLASS}><Building2 className="w-4 h-4" /></span>
            {t("settings.tabs.company") || "Şirkət Profili"}
          </TabsTrigger>
        )}

        <TabsTrigger value="notifications" className={SETTINGS_TAB_TRIGGER_CLASS}>
          <span className={SETTINGS_TAB_ICON_CLASS}><Bell className="w-4 h-4" /></span>
          {t("settings.tabs.notifications") || "Bildirişlər"}
        </TabsTrigger>
        
        <TabsTrigger value="security" className={SETTINGS_TAB_TRIGGER_CLASS}>
          <span className={SETTINGS_TAB_ICON_CLASS}><ShieldCheck className="w-4 h-4" /></span>
          {t("settings.tabs.security") || "Təhlükəsizlik"}
        </TabsTrigger>
      </TabsList>

      {/* ─── SAĞ PANEL (MƏZUMUN) ─── */}
      <div className="flex-1 min-w-0">
        
        {/* 1. GÖRÜNÜŞ VƏ DİL */}
        <TabsContent value="appearance" className={SETTINGS_PANEL_CLASS}>
          <h3 className={SETTINGS_HEADING_CLASS}>
            {t("settings.appearance.title") || "Görünüş və İnterfeys"}
          </h3>
          <div className="space-y-8 max-w-2xl">
            
            <div className="space-y-3">
              <Label className={SETTINGS_LABEL_CLASS}>
                {t("settings.appearance.theme") || "İnterfeys Mövzusu (Theme)"}
              </Label>
              <div className="grid grid-cols-3 gap-4">
                {[ 
                  { id: 'light', icon: Sun, label: t("settings.appearance.light") || 'Gündüz' }, 
                  { id: 'dark', icon: Moon, label: t("settings.appearance.dark") || 'Gecə' }, 
                  { id: 'system', icon: Smartphone, label: t("settings.appearance.system") || 'Sistem' } 
                ].map(tObj => (
                  <button
                    key={tObj.id}
                    type="button"
                    onClick={() => setTheme(tObj.id)}
                    aria-pressed={theme === tObj.id}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                      theme === tObj.id
                        ? "border-primary ring-2 ring-primary/30 bg-primary/5 text-primary"
                        : "border-border bg-card hover:border-muted-foreground/40 text-muted-foreground"
                    )}
                  >
                    <tObj.icon className="w-6 h-6" />
                    <span className="text-[13px] font-bold">{tObj.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className={SETTINGS_LABEL_CLASS}>
                {t("settings.appearance.colorTheme") || "Rəng Teması (Color Theme)"}
              </Label>
              <p className="text-xs font-medium text-muted-foreground -mt-1">
                {t("settings.appearance.colorThemeDesc") ||
                  "Tətbiqin əsas vurğu rəngini seçin. Seçdiyiniz kart dərhal aktivləşəcək, lakin dəyişiklik yalnız aşağıdakı düymə ilə tətbiq olunacaq."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {COLOR_THEMES.map((ct) => {
                  const isSelected = colorTheme === ct.id;
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => setColorThemeDraft(ct.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 transition-all p-3",
                        isSelected
                          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                          : "border-border bg-card hover:border-muted-foreground/40"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </span>
                      )}
                      <span
                        className="w-8 h-8 rounded-full shadow-sm ring-1 ring-black/5"
                        style={{ backgroundColor: ct.swatch }}
                      />
                      <span className="text-[12px] font-bold text-foreground">
                        {t(`settings.appearance.colorThemes.${ct.labelKey}`) || ct.labelKey}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label className={SETTINGS_LABEL_CLASS}>
                {t("settings.appearance.language") || "Sistem Dili"}
              </Label>
              <Select value={language} onValueChange={(v) => setLanguage(v ?? "az")}>
                <SelectTrigger className="h-12 w-full rounded-xl border-input bg-muted pl-4 text-[14px] font-bold text-foreground focus:border-primary focus:bg-background">
                  <Globe className="mr-1 size-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="az">🇦🇿 Azərbaycanca</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6 flex items-center justify-end gap-3">
              {isAppearanceDirty && !isAppearanceLoading && (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {t("settings.appearance.unsaved") || "Yadda saxlanılmamış dəyişikliklər var"}
                </span>
              )}
              <Button
                onClick={handleSaveAppearance}
                disabled={isAppearanceLoading || !isAppearanceDirty}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAppearanceLoading ? (t("settings.appearance.saving") || "Yadda saxlanılır...") : (t("settings.appearance.apply") || "Dəyişiklikləri Tətbiq Et")}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* 2. DƏVƏTLƏR VƏ İCAZƏLƏR */}
        <TabsContent value="defaults" className={SETTINGS_PANEL_CLASS}>
          <h3 className={SETTINGS_HEADING_CLASS}>
            {t("settings.defaults.title") || "Onboarding & İcazələr"}
          </h3>
          
          <div className="space-y-8 max-w-2xl">
            <div className="bg-primary/5 text-foreground p-4 rounded-xl text-[13px] font-medium leading-relaxed border border-primary/20">
              {t("settings.defaults.desc") || "Yeni əməkdaş (Member) və ya müştəri (Guest) dəvət edərkən onlara sistem tərəfindən avtomatik veriləcək rolları və layihə girişlərini buradan idarə edə bilərsiniz."}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className={SETTINGS_LABEL_SM_CLASS}>
                  {t("settings.defaults.memberRole") || "İşçilər üçün Rol (Member)"}
                </Label>
                <Select value={defaultMemberRoleId || undefined} onValueChange={(v) => setDefaultMemberRoleId(v ?? "")}>
                  <SelectTrigger className={SETTINGS_SELECT_CLASS}>
                    <SelectValue placeholder={`-- ${t("settings.defaults.selectRole") || "Rol Seçin"} --`} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={SETTINGS_LABEL_SM_CLASS}>
                  {t("settings.defaults.guestRole") || "Qonaqlar üçün Rol (Guest)"}
                </Label>
                <Select value={defaultGuestRoleId || undefined} onValueChange={(v) => setDefaultGuestRoleId(v ?? "")}>
                  <SelectTrigger className={SETTINGS_SELECT_CLASS}>
                    <SelectValue placeholder={`-- ${t("settings.defaults.selectRole") || "Rol Seçin"} --`} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className={SETTINGS_LABEL_CLASS}>
                {t("settings.defaults.autoProjects") || "Avtomatik Qoşulacaqları Layihələr"}
              </Label>
              <div className="border border-border rounded-xl p-4 bg-muted/30">
                <ProjectCheckboxList projects={projects} selected={defaultProjectIds} onChange={setDefaultProjectIds} />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleSaveDefaults} disabled={isDefaultsLoading} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold px-8 py-5 rounded-xl">
                {isDefaultsLoading ? (t("settings.defaults.saving") || "Saxlanılır...") : (t("settings.defaults.save") || "Dəvət Ayarlarını Yadda Saxla")}
              </Button>
            </div>

            {/* İCAZƏ QƏLİBİ (TEMPLATE) */}
            <div className="pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-[16px] font-black text-foreground">
                    {t("settings.defaults.permTemplate") || "İcazə Qəlibi (Permission Template)"}
                  </h4>
                  <p className="text-[12px] font-medium text-muted-foreground mt-1">
                    {t("settings.defaults.permDesc") || "Yuxarıda seçdiyiniz \"İşçi Rolu\"nun hansı hüquqlara sahib olacağını dəqiq tənzimləyin."}
                  </p>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[12px] font-bold border border-primary/20">
                  {selectedPermissionIds.length} {t("settings.defaults.permissionsCount") || "icazə"}
                </div>
              </div>

              {!defaultMemberRoleId ? (
                <div className="p-6 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground font-medium text-sm">
                  {t("settings.defaults.selectMemberFirstInfo") || "İcazələri tənzimləmək üçün yuxarıdan İşçi Rolu seçin."}
                </div>
              ) : (
                <div className="border border-border rounded-xl p-4 bg-card shadow-sm">
                  <PermissionCheckboxGroup t={t} permissions={permissions} selected={selectedPermissionIds} onChange={(ids) => setRolePermissionsMap((p) => ({ ...p, [defaultMemberRoleId]: ids }))} />
                  <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <Button onClick={handleSavePermissionTemplate} disabled={isPermissionsLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 py-5">
                      {isPermissionsLoading ? (t("settings.defaults.saving") || "Saxlanılır...") : (t("settings.defaults.permSave") || "İcazələri Təsdiqlə")}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* 3. ŞİRKƏT PROFİLİ (YALNIZ SUPER ADMIN) */}
        {isSuperAdmin && (
          <TabsContent value="company" className={SETTINGS_PANEL_CLASS}>
            <h3 className={SETTINGS_HEADING_CLASS}>
              {t("settings.company.title") || "Şirkət Rəsmi Məlumatları"}
            </h3>
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label className={SETTINGS_LABEL_SM_CLASS}>
                    {t("settings.company.name") || "Şirkətin Adı *"}
                  </Label>
                  <Input value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})} className="h-12 rounded-xl bg-muted border-input font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className={SETTINGS_LABEL_SM_CLASS}>
                    {t("settings.company.taxId") || "VÖEN / Qeydiyyat Kodu"}
                  </Label>
                  <Input value={companyForm.taxId} onChange={(e) => setCompanyForm({...companyForm, taxId: e.target.value})} className="h-12 rounded-xl bg-muted border-input font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className={SETTINGS_LABEL_SM_CLASS}>
                    {t("settings.company.website") || "Veb-sayt"}
                  </Label>
                  <Input value={companyForm.website} onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-muted border-input font-bold" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label className={SETTINGS_LABEL_SM_CLASS}>
                    {t("settings.company.desc") || "Fəaliyyət Sahəsi və Məqsəd"}
                  </Label>
                  <textarea rows={4} value={companyForm.description} onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})} className="w-full p-4 rounded-xl border border-input bg-muted text-[14px] font-medium text-foreground outline-none focus:border-primary resize-none" />
                </div>
              </div>
              <div className="pt-6 flex justify-end border-t border-border">
                <Button onClick={handleSaveCompany} disabled={isCompanyLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-xl">
                  {isCompanyLoading ? (t("settings.company.saving") || "Yadda saxlanılır...") : (t("settings.company.save") || "Şirkət Profilini Yenilə")}
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* 4. BİLDİRİŞLƏR (NOTIFICATIONS) */}
        <TabsContent value="notifications" className={SETTINGS_PANEL_CLASS}>
          <h3 className={SETTINGS_HEADING_CLASS}>
            {t("settings.notifications.title") || "Bildiriş Ayarları"}
          </h3>
          <div className="max-w-2xl py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl bg-muted/50">
            <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h4 className="text-[15px] font-bold text-foreground">
              {t("settings.notifications.wipTitle") || "Bildiriş Mərkəzi Hazırlanır"}
            </h4>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
              {t("settings.notifications.wipDesc") || "Email xəbərdarlıqları, səsli xəbərdarlıqlar və brauzer (push) bildirişlərinin fərdiləşdirilməsi növbəti yenilənmədə aktiv olacaq."}
            </p>
          </div>
        </TabsContent>

        {/* 5. TƏHLÜKƏSİZLİK (SECURITY) */}
        <TabsContent value="security" className={SETTINGS_PANEL_CLASS}>
          <h3 className={SETTINGS_HEADING_CLASS}>
            {t("settings.security.title") || "Hesab Təhlükəsizliyi"}
          </h3>
          <div className="space-y-6 max-w-2xl">
            <div className="p-5 border border-border rounded-xl bg-muted/50">
              <h4 className="text-[14px] font-bold text-foreground flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-muted-foreground" /> {t("settings.security.updatePass") || "Şifrəni Yenilə"}
              </h4>
              <div className="space-y-4">
                <Input type="password" placeholder={t("settings.security.oldPass") || "Köhnə şifrə"} className="h-11 rounded-lg bg-card border-input" />
                <Input type="password" placeholder={t("settings.security.newPass") || "Yeni şifrə"} className="h-11 rounded-lg bg-card border-input" />
                <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold rounded-lg px-6">
                  {t("settings.security.changePass") || "Şifrəni Dəyiş"}
                </Button>
              </div>
            </div>

            <div className="p-5 border border-destructive/20 rounded-xl bg-destructive/5">
              <h4 className="text-[14px] font-bold text-destructive flex items-center gap-2 mb-2">
                <LogOut className="w-4 h-4" /> {t("settings.security.logoutAll") || "Bütün Cihazlardan Çıxış Et"}
              </h4>
              <p className="text-[13px] text-destructive/80 mb-4">
                {t("settings.security.logoutDesc") || "Əgər hesabınızın başqa bir cihazda açıq qaldığından şübhələnirsinizsə, bu düyməyə basaraq bütün aktiv sessiyaları sonlandıra bilərsiniz."}
              </p>
              <Button variant="destructive" className="font-bold rounded-lg px-6">
                {t("settings.security.logoutBtn") || "İndi Çıxış Et"}
              </Button>
            </div>
          </div>
        </TabsContent>

      </div>
    </Tabs>
  );
}