"use client";

import { useState } from "react";
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
  ShieldCheck
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

// --- Köməkçi Modal Komponenti (Tam müstəqil işləyir) ---
function CustomModal({ isOpen, onClose, title, children, maxWidth = "max-w-3xl" }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={cn("bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200", maxWidth)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[18px] font-black text-slate-800 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Əsas Dropdown Komponenti ---
interface UserProfileDropdownProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  // Modal idarəetmə state-ləri
  const [isViewOpen, setViewOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isCompanyOpen, setCompanyOpen] = useState(false);

  // Tab state-i (View Details üçün)
  const [activeTab, setActiveTab] = useState("details");

  const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "OWNER";

  const VIEW_TABS = [
    { id: "details", label: "Details", icon: User },
    { id: "events", label: "Events", icon: Calendar },
    { id: "projects", label: "Projects", icon: Folder },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "team", label: "Team", icon: Users },
    { id: "activity", label: "Activity", icon: Activity },
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
          <DropdownMenuItem onClick={() => setViewOpen(true)} className="gap-3 p-3 rounded-xl cursor-pointer font-medium text-slate-700 focus:bg-blue-50 focus:text-blue-700">
            <User className="w-4 h-4" /> Mənim Məlumatlarım (View)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-3 p-3 rounded-xl cursor-pointer font-medium text-slate-700 focus:bg-blue-50 focus:text-blue-700">
            <Edit3 className="w-4 h-4" /> Məlumatları Yenilə (Edit)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCompanyOpen(true)} className="gap-3 p-3 rounded-xl cursor-pointer font-medium text-slate-700 focus:bg-blue-50 focus:text-blue-700">
            <Building className="w-4 h-4" /> {isSuperAdmin ? "Şirkət Məlumatları" : "Şöbə Məlumatları"}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-2 bg-gray-100" />
          
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="gap-3 p-3 rounded-xl cursor-pointer font-bold text-red-600 focus:bg-red-50 focus:text-red-700">
            <LogOut className="w-4 h-4" /> Çıxış (Log out)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ─── 1. Modal: View My Details ─── */}
      <CustomModal isOpen={isViewOpen} onClose={() => setViewOpen(false)} title="İstifadəçi Profili (View Details)">
        {/* Tab Menyu */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar pb-2">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap",
                  isActive ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Məzmunu */}
        {activeTab === "details" ? (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-5 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-gray-200/60 shadow-sm">
              <Avatar className="w-20 h-20 shadow-md border-2 border-white">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-blue-600 text-white font-black text-2xl">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{user.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> {user.role}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-white border border-gray-200 shadow-sm px-3 py-1 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5" /> M-Trans MMC
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon={Mail} label="Email Ünvanı" value={user.email} />
              <InfoCard icon={Clock} label="İş Saatları" value="09:00 - 18:00 (B.E - Cümə)" />
              <InfoCard icon={MapPin} label="Ünvan" value="Bakı şəh., Nərimanov r-nu" />
              <InfoCard icon={Users} label="Şöbə" value={isSuperAdmin ? "İdarə Heyəti" : "IT və İnkişaf"} />
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in">
            <div className="w-16 h-16 bg-blue-50 flex items-center justify-center rounded-2xl mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Məlumatlar cəlb edilir...</h3>
            <p className="text-[13px] font-medium text-slate-500 max-w-sm">
              Bu bölmə (<span className="text-blue-600 font-bold">{VIEW_TABS.find(t=>t.id === activeTab)?.label}</span>) arxa plandakı məlumat bazasından dinamik olaraq cəlb ediləcək.
            </p>
          </div>
        )}
      </CustomModal>

      {/* ─── 2. Modal: Edit My Details ─── */}
      <CustomModal isOpen={isEditOpen} onClose={() => setEditOpen(false)} title="Məlumatlarımı Yenilə (Edit Details)" maxWidth="max-w-2xl">
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setEditOpen(false); }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Ad və Soyad</label>
              <input defaultValue={user.name} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Email</label>
              <input defaultValue={user.email} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">İcazə Rolu (Dəyişdirilə bilməz)</label>
              <input defaultValue={user.role} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 text-[14px] font-bold cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">İş Saatları</label>
              <input defaultValue="09:00 - 18:00" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none transition-colors" />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Yaşayış / İş Ünvanı</label>
              <input defaultValue="Bakı şəh., Nərimanov r-nu" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none transition-colors" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={() => setEditOpen(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Ləğv Et
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-md transition-all active:scale-95">
              Yadda Saxla
            </button>
          </div>
        </form>
      </CustomModal>

      {/* ─── 3. Modal: Company / Department Info ─── */}
      <CustomModal isOpen={isCompanyOpen} onClose={() => setCompanyOpen(false)} title={isSuperAdmin ? "Şirkət Məlumatları (Company)" : "Şöbə Məlumatları (Department)"} maxWidth="max-w-2xl">
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setCompanyOpen(false); }}>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 mb-2">
            <Building className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <p className="text-[13px] font-medium text-blue-800 leading-relaxed">
              Bu bölmədə struktur məlumatları yerləşir. {isSuperAdmin ? "Super Admin olduğunuz üçün şirkət məlumatlarını dəyişə bilərsiniz." : "Yalnız şöbə rəhbərləri bu məlumatları redaktə edə bilər."}
            </p>
          </div>

          <div className="grid grid-cols-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">{isSuperAdmin ? "Şirkət Adı" : "Şöbə Adı"}</label>
              <input 
                defaultValue={isSuperAdmin ? "M-Trans Logistics MMC" : "İnformasiya Texnologiyaları Şöbəsi"} 
                disabled={!isSuperAdmin} // Dinamik rol yoxlaması burda tətbiq olunur
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 transition-colors" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Ümumi Təsvir və Məqsəd</label>
              <textarea 
                rows={3}
                defaultValue={isSuperAdmin ? "Ölkənin aparıcı logistika və təchizat zənciri provayderi." : "Şirkətin bütün rəqəmsal infrastrukturunu quran bölmə."} 
                disabled={!isSuperAdmin}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-[14px] font-bold focus:bg-white focus:border-blue-500 outline-none resize-none disabled:bg-gray-100 disabled:text-gray-500 transition-colors" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">İşçi Sayı</label>
                <input defaultValue={isSuperAdmin ? "120+" : "14"} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-[14px] font-bold text-gray-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">Yaranma Tarixi</label>
                <input defaultValue="2018-05-14" disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-[14px] font-bold text-gray-500 cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={() => setCompanyOpen(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
              Bağla
            </button>
            {isSuperAdmin && (
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-md transition-all active:scale-95">
                Dəyişikliyi Təsdiqlə
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
    <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-start gap-3">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-[14px] font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}