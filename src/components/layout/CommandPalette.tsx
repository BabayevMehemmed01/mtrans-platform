"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Əmr Paneli"
      description="Naviqasiya üçün axtarın..."
    >
      <CommandInput placeholder="Bir səhifə axtarın..." />
      <CommandList>
        <CommandEmpty>Nəticə tapılmadı.</CommandEmpty>
        <CommandGroup heading="Əsas">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.title}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Administrasiya">
          {adminItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.title}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
