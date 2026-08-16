"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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

// --- ALT KOMPONENTLƏR ---
function PermissionCheckboxGroup({ permissions, selected, onChange }: { permissions: Permission[]; selected: string[]; onChange: (ids: string[]) => void; }) {
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

        return (
          <div key={cat} className="bg-slate-50/50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3 cursor-pointer group" onClick={() => toggleCategory(perms)}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${allChecked ? "bg-blue-600 border-blue-600" : someChecked ? "bg-blue-100 border-blue-400" : "border-gray-300 group-hover:border-blue-400"}`}>
                {(allChecked || someChecked) && <Check className={`w-3.5 h-3.5 ${allChecked ? "text-white" : "text-blue-600"}`} strokeWidth={3} />}
              </div>
              <span className="text-[14px] font-bold text-slate-800">{CATEGORY_LABELS[cat] || cat}</span>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-gray-200 ml-auto">
                {catIds.filter((id) => selected.includes(id)).length} / {catIds.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
              {perms.map((p) => (
                <label key={p.id} className="flex items-center gap-3 py-1.5 cursor-pointer group rounded-lg hover:bg-white hover:shadow-sm px-2 transition-all">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected.includes(p.id) ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`} onClick={() => toggle(p.id)}>
                    {selected.includes(p.id) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-[13px] font-medium text-slate-600">{p.name}</span>
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
        <label key={project.id} className="flex items-center gap-3 py-2 cursor-pointer group rounded-xl border border-gray-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-sm px-3 transition-all">
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected.includes(project.id) ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`} onClick={() => toggle(project.id)}>
            {selected.includes(project.id) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </div>
          <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: project.color }} />
          <span className="text-[13px] font-bold text-slate-700 truncate">{project.name}</span>
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
  const router = useRouter();
  const { setTheme: setSystemTheme } = useTheme(); // YENİ: next-themes-dən gəlir
  
  const isSuperAdmin = typeof userRole === "string" ? userRole.includes("ADMIN") : (userRole?.name?.toUpperCase().includes("ADMIN") || userRole?.name?.toUpperCase().includes("OWNER"));

  // 1. Görünüş (Appearance) States
  const [theme, setTheme] = useState(currentUserSettings?.theme || "light");
  const [language, setLanguage] = useState(currentUserSettings?.language || "az");
  const [wallpaper, setWallpaper] = useState(currentUserSettings?.wallpaper || "default");

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
    setIsAppearanceLoading(true);
    try {
      const res = await fetch("/api/settings/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, language, wallpaper }),
      });
      if (!res.ok) throw new Error("Xəta baş verdi");
      
      // YENİ: Uğurla yazıldıqdan sonra effekti dərhal UI-da tətbiq etmək
      setSystemTheme(theme); // Gecə/Gündüz rejimi anında dəyişir
      router.refresh();      // Divar kağızı (layout.tsx-dən gələn) anında dəyişir

      toast.success("Görünüş və dil tənzimləmələri yadda saxlanıldı.");
    } catch (err: any) {
      toast.error(err.message || "Xəta baş verdi.");
    } finally {
      setIsAppearanceLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim()) return toast.error("Şirkət adı mütləqdir");
    setIsCompanyLoading(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      toast.success("Şirkət profili yeniləndi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const handleSaveDefaults = async () => {
    setIsDefaultsLoading(true);
    try {
      // Standart rollar və layihələr üçün Company modelini güncəlləyirik
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          defaultMemberRoleId, 
          defaultGuestRoleId,
          defaultProjectIds 
        }),
      });
      if (!res.ok) throw new Error("Xəta baş verdi");
      toast.success("Standart dəvət ayarları yeniləndi.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDefaultsLoading(false);
    }
  };

  const handleSavePermissionTemplate = async () => {
    if (!defaultMemberRoleId) return toast.error("Əvvəlcə standart İşçi (Member) rolu seçin");
    setIsPermissionsLoading(true);
    try {
      const res = await fetch(`/api/roles/${defaultMemberRoleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: selectedPermissionIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      toast.success("İcazə qəlibi (Template) uğurla yeniləndi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPermissionsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="appearance" className="flex flex-col md:flex-row gap-8 mt-6">
      
      {/* ─── SOL MENYU (VERTICAL TABS) ─── */}
      <TabsList className="flex flex-col h-auto w-full md:w-64 bg-transparent p-0 gap-2 border-none items-stretch justify-start">
        <TabsTrigger value="appearance" className="justify-start px-4 py-3.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-[14px] font-bold text-slate-600 bg-white border border-gray-200 shadow-sm hover:border-blue-300">
          <Palette className="w-5 h-5 mr-3" /> Görünüş və Dil
        </TabsTrigger>
        
        <TabsTrigger value="defaults" className="justify-start px-4 py-3.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-[14px] font-bold text-slate-600 bg-white border border-gray-200 shadow-sm hover:border-blue-300">
          <Users className="w-5 h-5 mr-3" /> Dəvət Ayarları
        </TabsTrigger>

        {isSuperAdmin && (
          <TabsTrigger value="company" className="justify-start px-4 py-3.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-[14px] font-bold text-slate-600 bg-white border border-gray-200 shadow-sm hover:border-blue-300">
            <Building2 className="w-5 h-5 mr-3" /> Şirkət Profili
          </TabsTrigger>
        )}

        <TabsTrigger value="notifications" className="justify-start px-4 py-3.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-[14px] font-bold text-slate-600 bg-white border border-gray-200 shadow-sm hover:border-blue-300">
          <Bell className="w-5 h-5 mr-3" /> Bildirişlər
        </TabsTrigger>
        
        <TabsTrigger value="security" className="justify-start px-4 py-3.5 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-[14px] font-bold text-slate-600 bg-white border border-gray-200 shadow-sm hover:border-blue-300">
          <ShieldCheck className="w-5 h-5 mr-3" /> Təhlükəsizlik
        </TabsTrigger>
      </TabsList>

      {/* ─── SAĞ PANEL (MƏZUMUN) ─── */}
      <div className="flex-1 min-w-0">
        
        {/* 1. GÖRÜNÜŞ VƏ DİL */}
        <TabsContent value="appearance" className="mt-0 border border-gray-200/80 rounded-2xl bg-white p-6 md:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black mb-6 text-slate-800 border-b border-gray-100 pb-4">Görünüş və İnterfeys</h3>
          <div className="space-y-8 max-w-2xl">
            
            <div className="space-y-3">
              <Label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">İnterfeys Mövzusu (Theme)</Label>
              <div className="grid grid-cols-3 gap-4">
                {[ { id: 'light', icon: Sun, label: 'Gündüz' }, { id: 'dark', icon: Moon, label: 'Gecə' }, { id: 'system', icon: Smartphone, label: 'Sistem' } ].map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === t.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white hover:border-gray-300 text-slate-600'}`}>
                    <t.icon className="w-6 h-6" />
                    <span className="text-[13px] font-bold">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Divar Kağızı (Wallpaper)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['default', 'gradient-1', 'mesh', 'abstract'].map(bg => (
                  <button key={bg} onClick={() => setWallpaper(bg)} className={`h-20 rounded-xl border-2 transition-all flex items-center justify-center ${wallpaper === bg ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'} bg-slate-100`}>
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Sistem Dili</Label>
              <div className="relative">
                <Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition-all cursor-pointer">
                  <option value="az">🇦🇿 Azərbaycanca</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="ru">🇷🇺 Русский</option>
                </select>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button onClick={handleSaveAppearance} disabled={isAppearanceLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl">
                {isAppearanceLoading ? "Yadda saxlanılır..." : "Dəyişiklikləri Tətbiq Et"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* 2. DƏVƏTLƏR VƏ İCAZƏLƏR */}
        <TabsContent value="defaults" className="mt-0 border border-gray-200/80 rounded-2xl bg-white p-6 md:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black mb-6 text-slate-800 border-b border-gray-100 pb-4">Onboarding & İcazələr</h3>
          
          <div className="space-y-8 max-w-2xl">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-[13px] font-medium leading-relaxed border border-blue-100">
              Yeni əməkdaş (Member) və ya müştəri (Guest) dəvət edərkən onlara sistem tərəfindən avtomatik veriləcək rolları və layihə girişlərini buradan idarə edə bilərsiniz.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">İşçilər üçün Rol (Member)</Label>
                <select value={defaultMemberRoleId} onChange={(e) => setDefaultMemberRoleId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none cursor-pointer">
                  <option value="">-- Rol Seçin --</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Qonaqlar üçün Rol (Guest)</Label>
                <select value={defaultGuestRoleId} onChange={(e) => setDefaultGuestRoleId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none cursor-pointer">
                  <option value="">-- Rol Seçin --</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Avtomatik Qoşulacaqları Layihələr</Label>
              <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50">
                <ProjectCheckboxList projects={projects} selected={defaultProjectIds} onChange={setDefaultProjectIds} />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleSaveDefaults} disabled={isDefaultsLoading} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-8 py-5 rounded-xl">
                {isDefaultsLoading ? "Saxlanılır..." : "Dəvət Ayarlarını Yadda Saxla"}
              </Button>
            </div>

            {/* İCAZƏ QƏLİBİ (TEMPLATE) */}
            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-[16px] font-black text-slate-800">İcazə Qəlibi (Permission Template)</h4>
                  <p className="text-[12px] font-medium text-slate-500 mt-1">Yuxarıda seçdiyiniz "İşçi Rolu"nun hansı hüquqlara sahib olacağını dəqiq tənzimləyin.</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-[12px] font-bold border border-indigo-100">
                  {selectedPermissionIds.length} icazə
                </div>
              </div>

              {!defaultMemberRoleId ? (
                <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl text-slate-400 font-medium text-sm">
                  İcazələri tənzimləmək üçün yuxarıdan İşçi Rolu seçin.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                  <PermissionCheckboxGroup permissions={permissions} selected={selectedPermissionIds} onChange={(ids) => setRolePermissionsMap((p) => ({ ...p, [defaultMemberRoleId]: ids }))} />
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <Button onClick={handleSavePermissionTemplate} disabled={isPermissionsLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 py-5">
                      {isPermissionsLoading ? "Saxlanılır..." : "İcazələri Təsdiqlə"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* 3. ŞİRKƏT PROFİLİ (YALNIZ SUPER ADMIN) */}
        {isSuperAdmin && (
          <TabsContent value="company" className="mt-0 border border-gray-200/80 rounded-2xl bg-white p-6 md:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6 text-slate-800 border-b border-gray-100 pb-4">Şirkət Rəsmi Məlumatları</h3>
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Şirkətin Adı *</Label>
                  <Input value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})} className="h-12 rounded-xl bg-slate-50 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">VÖEN / Qeydiyyat Kodu</Label>
                  <Input value={companyForm.taxId} onChange={(e) => setCompanyForm({...companyForm, taxId: e.target.value})} className="h-12 rounded-xl bg-slate-50 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Veb-sayt</Label>
                  <Input value={companyForm.website} onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})} placeholder="https://..." className="h-12 rounded-xl bg-slate-50 font-bold" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Fəaliyyət Sahəsi və Məqsəd</Label>
                  <textarea rows={4} value={companyForm.description} onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-medium outline-none focus:border-blue-500 resize-none" />
                </div>
              </div>
              <div className="pt-6 flex justify-end border-t border-gray-100">
                <Button onClick={handleSaveCompany} disabled={isCompanyLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl">
                  {isCompanyLoading ? "Yadda saxlanılır..." : "Şirkət Profilini Yenilə"}
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* 4. BİLDİRİŞLƏR (NOTIFICATIONS) */}
        <TabsContent value="notifications" className="mt-0 border border-gray-200/80 rounded-2xl bg-white p-6 md:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black mb-6 text-slate-800 border-b border-gray-100 pb-4">Bildiriş Ayarları</h3>
          <div className="max-w-2xl py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-xl bg-slate-50">
            <Bell className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="text-[15px] font-bold text-slate-700">Bildiriş Mərkəzi Hazırlanır</h4>
            <p className="text-[13px] text-slate-500 mt-1 max-w-sm">Email xəbərdarlıqları, səsli xəbərdarlıqlar və brauzer (push) bildirişlərinin fərdiləşdirilməsi növbəti yenilənmədə aktiv olacaq.</p>
          </div>
        </TabsContent>

        {/* 5. TƏHLÜKƏSİZLİK (SECURITY) */}
        <TabsContent value="security" className="mt-0 border border-gray-200/80 rounded-2xl bg-white p-6 md:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black mb-6 text-slate-800 border-b border-gray-100 pb-4">Hesab Təhlükəsizliyi</h3>
          <div className="space-y-6 max-w-2xl">
            <div className="p-5 border border-gray-200 rounded-xl bg-slate-50">
              <h4 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 mb-4"><Lock className="w-4 h-4 text-slate-500" /> Şifrəni Yenilə</h4>
              <div className="space-y-4">
                <Input type="password" placeholder="Köhnə şifrə" className="h-11 rounded-lg bg-white" />
                <Input type="password" placeholder="Yeni şifrə" className="h-11 rounded-lg bg-white" />
                <Button className="bg-slate-800 text-white font-bold rounded-lg px-6">Şifrəni Dəyiş</Button>
              </div>
            </div>

            <div className="p-5 border border-red-100 rounded-xl bg-red-50/50">
              <h4 className="text-[14px] font-bold text-red-800 flex items-center gap-2 mb-2"><LogOut className="w-4 h-4" /> Bütün Cihazlardan Çıxış Et</h4>
              <p className="text-[13px] text-red-600/80 mb-4">Əgər hesabınızın başqa bir cihazda açıq qaldığından şübhələnirsinizsə, bu düyməyə basaraq bütün aktiv sessiyaları sonlandıra bilərsiniz.</p>
              <Button variant="destructive" className="font-bold rounded-lg px-6 bg-red-600 hover:bg-red-700">İndi Çıxış Et</Button>
            </div>
          </div>
        </TabsContent>

      </div>
    </Tabs>
  );
}