"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // <-- BURA YENİ ƏLAVƏ EDİLDİ
import { signOut } from "next-auth/react";
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
  TrendingUp
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

// =============================================================================
// Köməkçi Modal Komponenti (React Portal ilə Z-index probleminə son!)
// =============================================================================
function CustomModal({ isOpen, onClose, title, children, maxWidth = "max-w-3xl" }: any) {
  const [mounted, setMounted] = useState(false);

  // SSR (Server Side Rendering) xətalarının qarşısını almaq üçün
  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal açılanda arxa planın sürüşməsini (scroll) dayandırırıq
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex justify-center items-start pt-10 pb-10 overflow-y-auto bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} // Arxa fona klikləyəndə bağla
    >
      <div 
        className={cn("bg-white rounded-2xl shadow-2xl w-full flex flex-col relative mb-10 mx-4 border border-gray-100", maxWidth)}
        onClick={(e) => e.stopPropagation()} // Daxilə klikləyəndə bağlanmasın
      >
        {/* Sticky Header (Həmişə yuxarıda görünür) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-10 rounded-t-2xl">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors bg-slate-50"
            title="Bağla (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Məzmunu */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  // createPortal elementi birbaşa <body> teqinin içinə render edir
  return createPortal(modalContent, document.body);
}

// =============================================================================
// Əsas Dropdown Komponenti
// =============================================================================
interface UserProfileDropdownProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const [isViewOpen, setViewOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isCompanyOpen, setCompanyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "OWNER";

  const VIEW_TABS = [
    { id: "details", label: "Məlumatlar", icon: User },
    { id: "events", label: "Təqvimlər", icon: Calendar },
    { id: "projects", label: "Layihələr", icon: Folder },
    { id: "tasks", label: "Tapşırıqlar", icon: CheckSquare },
    { id: "team", label: "Komanda", icon: Users },
    { id: "activity", label: "Fəaliyyət", icon: Activity },
  ];

  return (
    <>
      {/* ─── Dropdown Tətiyi (Header-də görünən hissə) ─── */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 outline-none hover:bg-slate-50 p-1.5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-200">
          <Avatar className="w-10 h-10 border border-gray-200 shadow-sm">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-[13px] font-bold text-slate-800 leading-none mb-1">{user.name}</span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md leading-none">
              {user.role}
            </span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-gray-200/80">
          <div className="px-3 py-2 mb-2 border-b border-gray-100">
            <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs font-medium text-slate-500 truncate">{user.email}</p>
          </div>

          <DropdownMenuItem onClick={() => setViewOpen(true)} className="gap-3 p-3 rounded-xl cursor-pointer font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
            <User className="w-4 h-4" /> Profilim (View Details)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-3 p-3 rounded-xl cursor-pointer font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
            <Edit3 className="w-4 h-4" /> Məlumatları Yenilə (Edit)
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

      {/* ─── 1. MODAL: View My Details (Genişləndirilmiş Profil Kartı) ─── */}
      <CustomModal isOpen={isViewOpen} onClose={() => setViewOpen(false)} title="İstifadəçi Profili" maxWidth="max-w-4xl">
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar pb-2">
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

        {activeTab === "details" ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Profil Qapağı (Cover) və Avatar */}
            <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 h-32 overflow-hidden shadow-sm">
              <div className="absolute -bottom-10 left-6">
                <Avatar className="w-24 h-24 shadow-xl border-4 border-white">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-slate-100 text-blue-700 font-black text-3xl">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            <div className="pt-10 px-2 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{user.name}</h3>
                <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Data Analitika və Rəqəmsal İnkişaf Rəhbəri
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> {user.role}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">
                    <Activity className="w-3.5 h-3.5" /> Aktiv (Onlayn)
                  </span>
                </div>
              </div>
              <button onClick={() => { setViewOpen(false); setEditOpen(true); }} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                <Edit3 className="w-4 h-4" /> Redaktə et
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <InfoCard icon={Mail} label="Email Ünvanı" value={user.email} />
              <InfoCard icon={Phone} label="Əlaqə Nömrəsi" value="+994 (55) 123 45 67" />
              <InfoCard icon={Clock} label="İş Saatları" value="09:00 - 18:00 (B.E - Cümə)" />
              <InfoCard icon={MapPin} label="Ünvan" value="Bakı şəh., Nərimanov r-nu" />
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200/80">
              <h4 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Haqqında (Bio)</h4>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                Şirkətin verilənlər bazası arxitekturasının qurulması, data analitikası və hesabatlıq proseslərinin idarə edilməsi. Power BI, Python və SQL texnologiyalarından istifadə edərək biznes qərarlarının optimallaşdırılmasına dəstək verir.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in">
            <div className="w-16 h-16 bg-blue-50 flex items-center justify-center rounded-2xl mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Məlumatlar cəlb edilir...</h3>
            <p className="text-[13px] font-medium text-slate-500 max-w-md">
              Bu bölmə (<span className="text-blue-600 font-bold">{VIEW_TABS.find(t=>t.id === activeTab)?.label}</span>) arxa plandakı məlumat bazasından dinamik olaraq cəlb ediləcək.
            </p>
          </div>
        )}
      </CustomModal>

      {/* ─── 2. MODAL: Edit My Details (Detallı Form) ─── */}
      <CustomModal isOpen={isEditOpen} onClose={() => setEditOpen(false)} title="Profil Məlumatlarını Yenilə" maxWidth="max-w-3xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setEditOpen(false); }}>
          
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Avatar className="w-16 h-16 shadow-sm border border-white">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-blue-600 text-white font-bold">{user.name.substring(0,2)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Profil Şəkli</h4>
              <p className="text-xs text-slate-500 mb-2">JPG, GIF və ya PNG. Maksimum 5MB.</p>
              <button type="button" className="text-[12px] font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                Şəkil Yüklə
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Ad və Soyad *</label>
              <input defaultValue={user.name} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Email Ünvanı *</label>
              <input type="email" defaultValue={user.email} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">İcazə Rolu</label>
              <div className="relative">
                <input defaultValue={user.role} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100/80 text-gray-500 text-[14px] font-semibold cursor-not-allowed" />
                <ShieldCheck className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[10px] text-red-400 font-medium pl-1">Rolu yalnız Super Admin dəyişə bilər.</p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Əlaqə Nömrəsi</label>
              <input defaultValue="+994551234567" placeholder="+994 (__) ___ __ __" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">İş Saatları</label>
              <input defaultValue="09:00 - 18:00 (B.E - Cümə)" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Yaşayış / İş Ünvanı</label>
              <input defaultValue="Bakı şəh., Nərimanov r-nu" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all" />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Haqqında (Bio) qısa məlumat</label>
              <textarea 
                rows={3} 
                defaultValue="Şirkətin verilənlər bazası arxitekturasının qurulması, data analitikası və hesabatlıq proseslərinin idarə edilməsi."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all resize-none" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button type="button" onClick={() => setEditOpen(false)} className="px-6 py-3 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Ləğv Et
            </button>
            <button type="submit" className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-md transition-all active:scale-95">
              Yadda Saxla
            </button>
          </div>
        </form>
      </CustomModal>

      {/* ─── 3. MODAL: Company / Department Info (Detallı və Peşəkar) ─── */}
      <CustomModal isOpen={isCompanyOpen} onClose={() => setCompanyOpen(false)} title={isSuperAdmin ? "Şirkət Məlumatları (Super Admin)" : "Şöbə Məlumatları"} maxWidth="max-w-3xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setCompanyOpen(false); }}>
          
          <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl mb-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-[15px] font-black text-blue-900 mb-1">Struktur və İdarəetmə Paneli</h4>
              <p className="text-[13px] font-medium text-blue-800/80 leading-relaxed">
                Bu bölmədəki məlumatlar bütün sistem üçün qlobal dəyər daşıyır. {isSuperAdmin ? "Siz Super Admin olaraq rəsmi şirkət rekvizitlərini və profilini buradan redaktə edə bilərsiniz." : "Siz yalnız rəhbəri olduğunuz şöbənin məlumatlarına baxa və dəyişə bilərsiniz."}
              </p>
            </div>
          </div>

          {/* Statistika Kartları */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-200/80 rounded-xl p-4 bg-white shadow-sm text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aktiv Layihələr</p>
              <p className="text-2xl font-black text-slate-800">12</p>
            </div>
            <div className="border border-gray-200/80 rounded-xl p-4 bg-white shadow-sm text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ümumi İşçi Sayı</p>
              <p className="text-2xl font-black text-slate-800">45</p>
            </div>
            <div className="border border-gray-200/80 rounded-xl p-4 bg-white shadow-sm text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aylıq Səmərəlilik</p>
              <p className="text-2xl font-black text-green-600 flex items-center justify-center gap-1"><TrendingUp className="w-4 h-4"/> 92%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">{isSuperAdmin ? "Şirkətin Rəsmi Adı" : "Şöbə Adı"}</label>
              <input 
                defaultValue={isSuperAdmin ? "M-Trans Logistics & Supply Chain MMC" : "İnformasiya Texnologiyaları Şöbəsi"} 
                disabled={!isSuperAdmin}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 transition-colors" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">{isSuperAdmin ? "VÖEN / Qeydiyyat Nömrəsi" : "Şöbə Kodu"}</label>
              <div className="relative">
                <input defaultValue={isSuperAdmin ? "1234567891" : "IT-001"} disabled={!isSuperAdmin} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 transition-colors pl-10" />
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Veb-sayt</label>
              <div className="relative">
                <input defaultValue="www.m-trans.az" disabled={!isSuperAdmin} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 transition-colors pl-10" />
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Ümumi Təsvir və Məqsəd</label>
              <textarea 
                rows={4}
                defaultValue={isSuperAdmin ? "Ölkənin aparıcı logistika, nəqliyyat və təchizat zənciri idarəetmə provayderi. Qlobal standartlara cavab verən tam rəqəmsallaşdırılmış ERP infrastrukturu ilə xidmət göstərir." : "Şirkətin bütün rəqəmsal infrastrukturunu quran, serverləri idarə edən və kiber təhlükəsizliyi təmin edən aparıcı bölmə."} 
                disabled={!isSuperAdmin}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-medium leading-relaxed focus:bg-white focus:border-blue-500 outline-none resize-none disabled:bg-gray-100 disabled:text-gray-500 transition-colors" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button type="button" onClick={() => setCompanyOpen(false)} className="px-6 py-3 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Bağla
            </button>
            {isSuperAdmin && (
              <button type="submit" className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-md transition-all active:scale-95">
                Dəyişikliyi Təsdiqlə
              </button>
            )}
          </div>
        </form>
      </CustomModal>
    </>
  );
}

// Kiçik köməkçi UI komponenti (Məlumat Kartları üçün)
function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-colors">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[14px] font-black text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}