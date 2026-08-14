"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Building2, CreditCard, Link as LinkIcon, Info, Calendar, Users, Shield, Check, FolderKanban, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type CompanyInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  plan: string;
  createdAt: Date;
  defaultProjectIds: string[];
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

// İcazələri kateqoriyaya görə qruplaşdır (RolesClient.tsx-dəki nümunə ilə eynidir)
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

function PermissionCheckboxGroup({
  permissions,
  selected,
  onChange,
}: {
  permissions: Permission[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const grouped = groupByCategory(permissions);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const toggleCategory = (catPerms: Permission[]) => {
    const catIds = catPerms.map((p) => p.id);
    const allSelected = catIds.every((id) => selected.includes(id));
    if (allSelected) {
      onChange(selected.filter((s) => !catIds.includes(s)));
    } else {
      const newIds = [...new Set([...selected, ...catIds])];
      onChange(newIds);
    }
  };

  return (
    <div className="space-y-5 max-h-[420px] overflow-y-auto pr-2">
      {Object.entries(grouped).map(([cat, perms]) => {
        const catIds = perms.map((p) => p.id);
        const allChecked = catIds.every((id) => selected.includes(id));
        const someChecked = catIds.some((id) => selected.includes(id));

        return (
          <div key={cat}>
            <div
              className="flex items-center gap-2 mb-2 cursor-pointer group"
              onClick={() => toggleCategory(perms)}
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  allChecked
                    ? "bg-blue-600 border-blue-600"
                    : someChecked
                    ? "bg-blue-200 border-blue-400"
                    : "border-gray-300 group-hover:border-blue-400"
                }`}
              >
                {(allChecked || someChecked) && (
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                )}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {CATEGORY_LABELS[cat] || cat}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {catIds.filter((id) => selected.includes(id)).length}/{catIds.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1 pl-6">
              {perms.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2.5 py-1 cursor-pointer group rounded hover:bg-gray-50 px-2"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected.includes(p.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300 group-hover:border-blue-400"
                    }`}
                    onClick={() => toggle(p.id)}
                  >
                    {selected.includes(p.id) && (
                      <Check className="w-2 h-2 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="text-sm text-gray-600">{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectCheckboxList({
  projects,
  selected,
  onChange,
}: {
  projects: ProjectOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
      {projects.map((project) => (
        <label
          key={project.id}
          className="flex items-center gap-2.5 py-1.5 cursor-pointer group rounded hover:bg-[hsl(var(--muted))/50] px-2"
        >
          <div
            className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              selected.includes(project.id)
                ? "bg-blue-600 border-blue-600"
                : "border-gray-300 group-hover:border-blue-400"
            }`}
            onClick={() => toggle(project.id)}
          >
            {selected.includes(project.id) && (
              <Check className="w-2 h-2 text-white" strokeWidth={3} />
            )}
          </div>
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <span className="text-sm text-gray-600">{project.name}</span>
        </label>
      ))}
    </div>
  );
}

export function SettingsClient({
  initialCompany,
  roles,
  permissions,
  projects,
}: {
  initialCompany: CompanyInfo;
  roles: any[];
  permissions: Permission[];
  projects: ProjectOption[];
}) {
  const [company, setCompany] = useState(initialCompany);

  // General Form states
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description || "");
  const [website, setWebsite] = useState(company.website || "");
  const [timezone, setTimezone] = useState("Asia/Baku");
  const [language, setLanguage] = useState("az");

  // Defaults Form states
  const defaultRoleObj = roles.find(r => r.isDefault);
  const [defaultRoleId, setDefaultRoleId] = useState(defaultRoleObj?.id || "");

  // Permission template (default rolun icazələri) state
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const role of roles) {
      map[role.id] = role.permissions?.map((rp: any) => rp.permission.id) ?? [];
    }
    return map;
  });
  const selectedPermissionIds = rolePermissionsMap[defaultRoleId] ?? [];

  // Default layihə girişi state
  const [defaultProjectIds, setDefaultProjectIds] = useState<string[]>(company.defaultProjectIds || []);

  const [isLoading, setIsLoading] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  const handleSaveGeneral = async () => {
    if (!name.trim()) return toast.error("Şirkət adı mütləqdir");
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, website }), // Timezone and language can be added to company/user model later
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      const updated = await res.json();
      setCompany((prev) => ({ ...prev, ...updated }));
      toast.success("Məlumatlar yeniləndi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDefaultRole = async () => {
    if (!defaultRoleId) return toast.error("Zəhmət olmasa bir rol seçin");
    setIsRoleLoading(true);
    try {
      const res = await fetch("/api/settings/default-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: defaultRoleId }),
      });
      if (!res.ok) throw new Error("Xəta baş verdi");
      toast.success("Standart rol yeniləndi. Yeni istifadəçilərə avtomatik bu rol veriləcək.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRoleLoading(false);
    }
  };

  const handleSavePermissionTemplate = async () => {
    if (!defaultRoleId) return toast.error("Əvvəlcə standart rol seçin");
    setIsPermissionsLoading(true);
    try {
      const res = await fetch(`/api/roles/${defaultRoleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: selectedPermissionIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      toast.success("İcazə qəlibi yeniləndi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPermissionsLoading(false);
    }
  };

  const handleSaveDefaultProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const res = await fetch("/api/settings/default-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: defaultProjectIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      const data = await res.json();
      setDefaultProjectIds(data.defaultProjectIds);
      setCompany((prev) => ({ ...prev, defaultProjectIds: data.defaultProjectIds }));
      toast.success("Default layihə girişi yeniləndi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('az-AZ', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className="mt-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 bg-transparent border-b border-[hsl(var(--border))] rounded-none w-full justify-start h-auto p-0 gap-6 overflow-x-auto">
          <TabsTrigger
            value="general"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--primary))] data-[state=active]:bg-transparent px-1 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Ümumi (General)
          </TabsTrigger>
          <TabsTrigger
            value="defaults"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--primary))] data-[state=active]:bg-transparent px-1 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            İstifadəçi Dəvətləri (Defaults)
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(var(--primary))] data-[state=active]:bg-transparent px-1 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Təhlükəsizlik (Security)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[hsl(var(--primary))]" />
              Şirkət Profili
            </h3>

            <div className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label>Şirkətin Adı <span className="text-red-500">*</span></Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Məs: Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <Label>Loqo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] flex items-center justify-center overflow-hidden">
                    <Building2 className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <Button variant="outline" size="sm">Loqo Yüklə</Button>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">Gələcəkdə UploadThing ilə aktivləşəcək</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Saat Qurşağı (Timezone)</Label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                >
                  <option value="Asia/Baku">Asia/Baku (GMT+4)</option>
                  <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="America/New_York">America/New_York (GMT-5)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Sistem Dili</Label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                >
                  <option value="az">Azərbaycanca</option>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>İş Sahəsi (Slug)</Label>
                <div className="flex bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg overflow-hidden">
                  <span className="px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">
                    app.sizinsayt.com/
                  </span>
                  <input
                    value={company.slug}
                    disabled
                    className="w-full px-3 py-2.5 bg-transparent text-sm opacity-70 cursor-not-allowed outline-none"
                  />
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Slug yalnız yaradılış zamanı təyin edilir və dəyişdirilə bilməz.</p>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[hsl(var(--border))]">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Calendar className="w-4 h-4" />
                  Qeydiyyat tarixi: {formatDate(company.createdAt)}
                </div>
                <Button
                  onClick={handleSaveGeneral}
                  disabled={isLoading}
                  className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))/90]"
                >
                  {isLoading ? "Yadda saxlanılır..." : "Dəyişiklikləri Yadda Saxla"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-6">
          <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-[hsl(var(--primary))]" />
              Standart Rollar və İcazələr (Defaults)
            </h3>

            <div className="space-y-6 max-w-xl">
              <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-sm mb-6 border border-blue-100 dark:border-blue-900">
                Bu bölmədə sistemə yeni istifadəçi dəvət etdiyiniz zaman, əgər xüsusi bir rol seçilməyibsə, ona avtomatik veriləcək <b>Standart Rolu</b> (Default Role) seçə bilərsiniz.
              </div>

              <div className="space-y-2">
                <Label>Standart Rol (Default Role)</Label>
                <select
                  value={defaultRoleId}
                  onChange={(e) => setDefaultRoleId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">-- Rol Seçin --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.isDefault ? "(Hazırkı Default)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Seçilmiş rolun bütün icazələri yeni qoşulan istifadəçiyə dərhal tətbiq olunacaq.
                </p>
              </div>

              <div className="pt-4 border-t border-[hsl(var(--border))] flex justify-end">
                <Button
                  onClick={handleSaveDefaultRole}
                  disabled={isRoleLoading || !defaultRoleId}
                  className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))/90]"
                >
                  {isRoleLoading ? "Tətbiq edilir..." : "Standart Rolu Təyin Et"}
                </Button>
              </div>
            </div>
          </div>

          {/* İstifadəçi Dəvəti və İcazələr */}
          <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[hsl(var(--primary))]" />
              İstifadəçi Dəvəti və İcazələr
            </h3>

            <div className="space-y-8 max-w-xl">
              {/* İcazə Qəlibi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>İcazə Qəlibi (Permission template)</Label>
                  {defaultRoleId && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {selectedPermissionIds.length} icazə seçildi
                    </span>
                  )}
                </div>

                {!defaultRoleId ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-lg p-4">
                    İcazələri redaktə etmək üçün əvvəlcə yuxarıdan bir <b>Standart Rol</b> seçin. Seçili rol olmadan onun icazələrini dəyişmək mümkün deyil.
                  </div>
                ) : (
                  <>
                    <div className="border border-[hsl(var(--border))] rounded-xl p-4">
                      <PermissionCheckboxGroup
                        permissions={permissions}
                        selected={selectedPermissionIds}
                        onChange={(ids) =>
                          setRolePermissionsMap((prev) => ({ ...prev, [defaultRoleId]: ids }))
                        }
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSavePermissionTemplate}
                        disabled={isPermissionsLoading}
                        className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))/90]"
                      >
                        {isPermissionsLoading ? "Yadda saxlanılır..." : "Yadda saxla"}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Default Layihə Girişi */}
              <div className="space-y-3 pt-6 border-t border-[hsl(var(--border))]">
                <Label className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4" />
                  Default Layihə Girişi (Default project access)
                </Label>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Bu layihələr seçilibsə, yeni "Üzv" tipli dəvətlə qoşulan hər kəs avtomatik olaraq bu layihələrə əlavə ediləcək.
                </p>

                {projects.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-lg p-4">
                    Şirkətdə hələ heç bir aktiv layihə yoxdur. Layihə yaratdıqdan sonra buradan default giriş təyin edə bilərsiniz.
                  </div>
                ) : (
                  <>
                    <div className="border border-[hsl(var(--border))] rounded-xl p-4">
                      <ProjectCheckboxList
                        projects={projects}
                        selected={defaultProjectIds}
                        onChange={setDefaultProjectIds}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveDefaultProjects}
                        disabled={isProjectsLoading}
                        className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))/90]"
                      >
                        {isProjectsLoading ? "Yadda saxlanılır..." : "Yadda saxla"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[hsl(var(--primary))]" />
              Təhlükəsizlik
            </h3>

            <div className="space-y-4 max-w-xl text-[hsl(var(--muted-foreground))]">
              <p className="text-sm">
                İki mərhələli doğrulama (2FA), şifrə siyasətləri və iclas idarəetməsi kimi inkişaf etmiş təhlükəsizlik xüsusiyyətləri tezliklə aktivləşdiriləcək.
              </p>
              <div className="h-32 border border-dashed border-[hsl(var(--border))] rounded-lg flex items-center justify-center bg-[hsl(var(--muted))/30]">
                <span className="text-sm">Tezliklə...</span>
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
