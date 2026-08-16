"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import useSWR from "swr";
import {
  User,
  Settings,
  Building,
  LogOut,
  Mail,
  MapPin,
  Clock,
  Briefcase,
  Calendar,
  Folder,
  CheckSquare,
  Users,
  Activity,
  X,
  Edit3,
  Loader2,
  ShieldCheck,
  Phone,
  Globe,
  FileText,
  TrendingUp,
  Image as ImageIcon,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  MoreHorizontal
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// =============================================================================
// MODAL KOMPONENTİ
// =============================================================================
function CustomModal({ isOpen, onClose, title, children, maxWidth = "max-w-3xl" }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className={cn("bg-white rounded-2xl shadow-2xl w-full flex flex-col relative max-h-[90vh] overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200", maxWidth)} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10 shrink-0">
          <h2 className="text-[18px] font-black text-slate-800 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors bg-slate-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar p-6 bg-white">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// =============================================================================
// ƏSAS KOMPONENT
// =============================================================================
interface UserProfileDropdownProps {
  user: any; // Header-dən gələn session.user obyekti
}

export function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const router = useRouter();
  const [isViewOpen, setViewOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isCompanyOpen, setCompanyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SWR ilə Xülasə məlumatlarının çəkilməsi
  const { data: summaryData, isLoading: isSummaryLoading } = useSWR(
    isViewOpen && ["projects", "tasks", "team"].includes(activeTab) ? "/api/profile/summary" : null,
    fetcher
  );

  // Super Admin Yoxlaması
  const roleName = typeof user?.role === "string" ? user.role : (user?.role?.name || "");
  const isSuperAdmin = roleName.toUpperCase().includes("ADMIN") || roleName.toUpperCase().includes("OWNER");

  // Şirkət Məlumatları (State)
  const [companyForm, setCompanyForm] = useState({
    name: user?.company?.name || "",
    taxId: user?.company?.taxId || "",
    website: user?.company?.website || "",
    description: user?.company?.description || "",
    logo: user?.company?.logo || "",
  });

  const handleNavigation = (path: string) => {
    setViewOpen(false);
    router.push(path);
  };

  // Şirkət Məlumatlarının Yenilənməsi
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      if (res.ok) {
        setCompanyOpen(false);
        router.refresh(); // Məlumatların yenilənməsi üçün
      } else {
        alert("Xəta baş verdi. Məlumatlar yenilənmədi.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const VIEW_TABS = [
    { id: "details", label: "Məlumatlar", icon: User },
    { id: "projects", label: "Layihələr", icon: Folder },
    { id: "tasks", label: "Tapşırıqlar", icon: CheckSquare },
    { id: "team", label: "Komanda", icon: Users },
    { id: "events", label: "Təqvimlər", icon: Calendar },
    { id: "activity", label: "Fəaliyyət", icon: Activity },
  ];

  return (
    <>
      {/* ─── DROPDOWN TƏTİYİ ─── */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 outline-none hover:bg-slate-50 p-1.5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-200">
          <Avatar className="w-10 h-10 border border-gray-200 shadow-sm">
            <AvatarImage src={user?.image || user?.avatar} />
            <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm">
              {(user?.name || "U").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-[13px] font-bold text-slate-800 leading-none mb-1">{user?.name}</span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md leading-none truncate max-w-[120px]">
              {roleName || "İstifadəçi"}
            </span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-gray-200/80 z-[60]">
          <div className="px-3 py-2 mb-2 border-b border-gray-100">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs font-medium text-slate-500 truncate">{user?.email}</p>
          </div>
          <DropdownMenuItem onClick={() => setViewOpen(true)} className="gap-3 p-3 rounded-xl cursor-pointer font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
            <User className="w-4 h-4" /> Profilim (View Details)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-3 p-3 rounded-xl cursor-pointer font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
            <Edit3 className="w-4 h-4" /> Məlumatları Yenilə
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCompanyOpen(true)} className="gap-3 p-3 rounded-xl cursor-pointer font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
            <Building className="w-4 h-4" /> {isSuperAdmin ? "Şirkət Tənzimləmələri" : "Şöbə Məlumatları"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-2 bg-gray-100" />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="gap-3 p-3 rounded-xl cursor-pointer font-bold text-red-600 hover:bg-red-50 hover:text-red-700">
            <LogOut className="w-4 h-4" /> Sistemdən Çıx
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ─── 1. MODAL: İSTİFADƏÇİ PROFİLİ (VIEW) ─── */}
      <CustomModal isOpen={isViewOpen} onClose={() => setViewOpen(false)} title="İstifadəçi Profili" maxWidth="max-w-4xl">
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar pb-3">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap",
                  isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="animate-in fade-in">
          {/* TAB: MƏLUMATLAR */}
          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 h-32 overflow-visible shadow-sm">
                <div className="absolute -bottom-10 left-6">
                  <Avatar className="w-24 h-24 shadow-xl border-4 border-white bg-white">
                    <AvatarImage src={user?.image || user?.avatar} />
                    <AvatarFallback className="bg-slate-100 text-blue-700 font-black text-3xl">{(user?.name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="pt-12 px-2 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{user?.name}</h3>
                  <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> {user?.jobTitle || "Peşəkar Mütəxəssis"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" /> {roleName || "İstifadəçi"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-lg">
                      <Activity className="w-3.5 h-3.5" /> Aktiv (Onlayn)
                    </span>
                  </div>
                </div>
                <button onClick={() => { setViewOpen(false); setEditOpen(true); }} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  <Edit3 className="w-4 h-4" /> Redaktə et
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <InfoCard icon={Mail} label="Email Ünvanı" value={user?.email || "Qeyd edilməyib"} />
                <InfoCard icon={Phone} label="Əlaqə Nömrəsi" value={user?.phone || "Qeyd edilməyib"} />
                <InfoCard icon={Clock} label="İş Saatları" value={user?.workingHours || "09:00 - 18:00 (B.E - Cümə)"} />
                <InfoCard icon={MapPin} label="Ünvan" value={user?.address || "Qeyd edilməyib"} />
              </div>
              {user?.bio && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200/80 mt-4">
                  <h4 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Haqqında (Bio)</h4>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{user.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: LAYİHƏLƏR */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              {isSummaryLoading ? (
                <LoadingState text="Layihələr cəlb edilir..." />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summaryData?.projects?.map((proj: any) => (
                      <div key={proj.id} className="p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: proj.color }}>
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[15px] font-bold text-slate-800 truncate">{proj.name}</h4>
                          <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{proj.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(!summaryData?.projects || summaryData.projects.length === 0) && (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-gray-200/50 text-slate-500 font-medium">Hələ heç bir layihədə iştirak etmirsiniz.</div>
                  )}
                  <button onClick={() => handleNavigation('/dashboard/projects')} className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-6 py-3 rounded-xl font-bold transition-colors">
                    Bütün Layihələrə Keçid <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAB: TAPŞIRIQLAR */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {isSummaryLoading ? (
                <LoadingState text="Tapşırıqlar cəlb edilir..." />
              ) : (
                <>
                  <div className="space-y-3">
                    {summaryData?.tasks?.map((task: any) => (
                      <div key={task.id} className="p-4 rounded-xl border border-gray-200/80 bg-white flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          {task.status === "IN_PROGRESS" ? <CircleDashed className="w-5 h-5 text-blue-500 animate-spin-slow" /> : <CheckCircle2 className="w-5 h-5 text-slate-300" />}
                          <h4 className="text-[14px] font-bold text-slate-800">{task.title}</h4>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                  {(!summaryData?.tasks || summaryData.tasks.length === 0) && (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-gray-200/50 text-slate-500 font-medium">Hal-hazırda aktiv tapşırığınız yoxdur.</div>
                  )}
                  <button onClick={() => handleNavigation('/dashboard/my-work')} className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-6 py-3 rounded-xl font-bold transition-colors">
                    Mənim İşlərimə Keçid <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAB: KOMANDA */}
          {activeTab === "team" && (
            <div className="space-y-4">
              {isSummaryLoading ? (
                <LoadingState text="Komanda üzvləri cəlb edilir..." />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {summaryData?.team?.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-bold text-slate-800 truncate">{member.name}</h4>
                          <p className="text-[12px] font-medium text-slate-500 truncate">{member.jobTitle || member.role?.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleNavigation('/dashboard/members')} className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-6 py-3 rounded-xl font-bold transition-colors">
                    Komandaya Keçid <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Hələlik hazırlanmayan səhifələr (Təqvim, Fəaliyyət) */}
          {(activeTab === "events" || activeTab === "activity") && (
            <LoadingState text="Bu bölmənin API bağlantıları (Backend) qurulur. Tezliklə aktiv olacaq." isConstruction />
          )}
        </div>
      </CustomModal>

      {/* ─── 2. MODAL: PROFİLİ YENİLƏ (EDIT) ─── */}
      <CustomModal isOpen={isEditOpen} onClose={() => setEditOpen(false)} title="Profil Məlumatlarını Yenilə" maxWidth="max-w-3xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setEditOpen(false); /* Burada profile yeniləmə API-si çağırılacaq */ }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Ad və Soyad *</label>
              <input defaultValue={user?.name} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-semibold focus:border-blue-500 outline-none transition-all shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Email Ünvanı *</label>
              <input type="email" defaultValue={user?.email} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-semibold focus:border-blue-500 outline-none transition-all shadow-sm" disabled />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Əlaqə Nömrəsi</label>
              <input defaultValue={user?.phone || ""} placeholder="+994 (55) 000 00 00" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-semibold focus:border-blue-500 outline-none transition-all shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Yaşayış / İş Ünvanı</label>
              <input defaultValue={user?.address || ""} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-semibold focus:border-blue-500 outline-none transition-all shadow-sm" />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Haqqında (Bio)</label>
              <textarea rows={3} defaultValue={user?.bio || ""} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-semibold focus:border-blue-500 outline-none resize-none transition-all shadow-sm" />
            </div>
          </div>
          <div className="pt-4 mt-2 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setEditOpen(false)} className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">Ləğv Et</button>
            <button type="submit" className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-md transition-all active:scale-95">Yadda Saxla</button>
          </div>
        </form>
      </CustomModal>

      {/* ─── 3. MODAL: ŞİRKƏT MƏLUMATLARI ─── */}
      <CustomModal isOpen={isCompanyOpen} onClose={() => setCompanyOpen(false)} title={isSuperAdmin ? "Şirkət Məlumatları (Super Admin)" : "Şöbə Məlumatları"} maxWidth="max-w-3xl">
        <form className="space-y-6" onSubmit={handleCompanySubmit}>
          
          <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-gray-200/80 rounded-2xl mb-2">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-[15px] font-black text-slate-800 mb-1">Struktur və İdarəetmə</h4>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                {isSuperAdmin 
                  ? "Siz Super Admin olaraq rəsmi şirkət rekvizitlərini və profilini buradan redaktə edə bilərsiniz." 
                  : "Siz yalnız rəhbəri olduğunuz şöbənin məlumatlarına baxa bilərsiniz."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {/* Şirkət Loqosu - Sadəcə URL daxil etmək üçün, gələcəkdə UploadThing bura gələcək */}
            <div className="col-span-1 sm:col-span-2 space-y-1.5 flex items-center gap-4 p-4 rounded-xl border border-gray-200 border-dashed bg-slate-50">
               {companyForm.logo ? (
                 <img src={companyForm.logo} alt="Logo" className="w-16 h-16 rounded-xl object-contain bg-white border border-gray-200 shadow-sm" />
               ) : (
                 <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                    <ImageIcon className="w-6 h-6" />
                 </div>
               )}
               <div className="flex-1">
                 <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1 mb-1 block">Şirkət Loqosu (URL)</label>
                 <input 
                   value={companyForm.logo} 
                   onChange={e => setCompanyForm({...companyForm, logo: e.target.value})}
                   placeholder="https://... (Şəkil linki)" 
                   disabled={!isSuperAdmin}
                   className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium focus:border-blue-500 outline-none disabled:bg-gray-50 transition-colors" 
                 />
                 {/* Qeyd: Gələcəkdə burada <UploadButton /> istifadə edəcəyik */}
               </div>
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">{isSuperAdmin ? "Şirkətin Rəsmi Adı" : "Şöbə Adı"}</label>
              <input 
                value={companyForm.name}
                onChange={e => setCompanyForm({...companyForm, name: e.target.value})}
                disabled={!isSuperAdmin}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-bold focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors shadow-sm" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">{isSuperAdmin ? "VÖEN / Qeydiyyat" : "Şöbə Kodu"}</label>
              <div className="relative">
                <input 
                  value={companyForm.taxId}
                  onChange={e => setCompanyForm({...companyForm, taxId: e.target.value})}
                  disabled={!isSuperAdmin} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-bold focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors pl-10 shadow-sm" 
                />
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Veb-sayt</label>
              <div className="relative">
                <input 
                  value={companyForm.website}
                  onChange={e => setCompanyForm({...companyForm, website: e.target.value})}
                  disabled={!isSuperAdmin} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-bold focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors pl-10 shadow-sm" 
                />
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Ümumi Təsvir və Məqsəd</label>
              <textarea 
                rows={3}
                value={companyForm.description}
                onChange={e => setCompanyForm({...companyForm, description: e.target.value})}
                disabled={!isSuperAdmin}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[14px] font-medium focus:border-blue-500 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors shadow-sm" 
              />
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={() => setCompanyOpen(false)} className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">Bağla</button>
            {isSuperAdmin && (
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-md transition-all active:scale-95 disabled:opacity-70">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Saxlanılır..." : "Təsdiqlə və Yadda Saxla"}
              </button>
            )}
          </div>
        </form>
      </CustomModal>
    </>
  );
}

// Kiçik köməkçi UI komponenti
function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-4 hover:border-gray-300 transition-colors">
      <div className="p-2.5 bg-white text-blue-600 rounded-lg border border-gray-100 shadow-sm flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-[14px] font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function LoadingState({ text, isConstruction = false }: { text: string, isConstruction?: boolean }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center">
      {isConstruction ? (
        <MoreHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      ) : (
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
      )}
      <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">{text}</p>
    </div>
  );
}