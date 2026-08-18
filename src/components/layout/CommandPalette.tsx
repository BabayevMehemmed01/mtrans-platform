"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCommandPaletteStore } from "@/store/useCommandPaletteStore";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  BarChart3,
  Tag,
  CircleUser,
  Contact,
  MessageSquare,
  Search,       // Əlavə etdik
  PlusCircle    // Əlavə etdik
} from "lucide-react";

// =============================================================================
// Command Palette — Cmd+K / Ctrl+K qlobal naviqasiya paneli
// Sidebar.tsx-dəki naviqasiya siyahısını güzgüləyir
// =============================================================================

const navItems = [
  { title: "Ana Səhifə", href: "/dashboard", icon: LayoutDashboard },
  { title: "Mənim İşlərim", href: "/dashboard/my-work", icon: CircleUser },
  { title: "Layihələr", href: "/dashboard/projects", icon: FolderKanban },
  { title: "Komanda", href: "/dashboard/members", icon: Users },
  { title: "Şöbələr", href: "/dashboard/departments", icon: Building2 },
  { title: "CRM", href: "/dashboard/crm", icon: Contact },
  { title: "Mesajlar", href: "/dashboard/chat", icon: MessageSquare },
  { title: "Hesabatlar", href: "/dashboard/reports", icon: BarChart3 },
];

const adminItems = [
  { title: "Rollar & İcazələr", href: "/dashboard/roles", icon: ShieldCheck },
  { title: "Etiketlər", href: "/dashboard/labels", icon: Tag },
  { title: "Parametrlər", href: "/dashboard/settings", icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname(); // YENİ: İstifadəçinin hansı səhifədə olduğunu bilmək üçün
  const { open, setOpen, toggle } = useCommandPaletteStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  // YENİ: Səhifəyə özəl (Context-aware) axtarış seçimləri
  const renderContextItems = () => {
    if (!pathname) return null;

    if (pathname.includes("/dashboard/projects")) {
      return (
        <CommandGroup heading="Cari Səhifə: Layihələr">
          <CommandItem onSelect={() => handleSelect("/dashboard/projects/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Yeni Layihə Yarat</span>
          </CommandItem>
          {/* Əgər səhifə daxili xüsusi məntiq işlətmək istəsəniz bura əlavə edə bilərsiniz */}
          <CommandItem onSelect={() => setOpen(false)}>
            <Search className="mr-2 h-4 w-4" />
            <span>Layihələr içində detallı axtarış...</span>
          </CommandItem>
        </CommandGroup>
      );
    }

    if (pathname.includes("/dashboard/members")) {
      return (
        <CommandGroup heading="Cari Səhifə: Komanda">
          <CommandItem onSelect={() => handleSelect("/dashboard/members/invite")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Yeni Üzv Dəvət Et</span>
          </CommandItem>
        </CommandGroup>
      );
    }

    return null;
  };

  // Nəzarət: Əgər open dəyəri yoxdursa ümumiyyətlə render etmə
  if (typeof open === "undefined") return null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      // title və description proplarını sildik (çöküşə səbəb ola bilərdi)
    >
      <CommandInput placeholder="Naviqasiya və ya əmr axtarın..." />
      <CommandList>
        <CommandEmpty>Nəticə tapılmadı.</CommandEmpty>
        
        {/* 1. İlk öncə olduğunuz səhifəyə aid olan funksiyalar (Context-Aware) görünəcək */}
        {renderContextItems()}

        {/* 2. Daha sonra qlobal menyu gələcək */}
        <CommandGroup heading="Qlobal Naviqasiya">
          {navItems.map((item) => {
            const Icon = item.icon; // Təhlükəsiz render üçün
            return (
              <CommandItem
                key={item.href}
                value={item.title}
                onSelect={() => handleSelect(item.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        
        <CommandGroup heading="Administrasiya">
          {adminItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={item.title}
                onSelect={() => handleSelect(item.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}