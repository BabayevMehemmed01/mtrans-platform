"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/useSidebarStore";
import { getTranslation } from "@/lib/i18n";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  BarChart3,
  Tag,
  CircleUser,
  Contact,
  MessageSquare,
  Network, // Collab üçün ikon
} from "lucide-react";

// =============================================================================
// Navigasiya Linkləri (tKey əlavə olundu)
// =============================================================================
const navItems = [
  {
    title: "Ana Səhifə",
    tKey: "menu.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Mənim İşlərim",
    tKey: "menu.myWork",
    href: "/dashboard/my-work",
    icon: CircleUser,
  },
  {
    title: "Layihələr",
    tKey: "menu.projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    title: "Collab (Ortaq)",
    tKey: "menu.collab",
    href: "/dashboard/collab",
    icon: Network,
  },
  {
    title: "Komanda",
    tKey: "menu.team",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    title: "Şöbələr",
    tKey: "menu.departments",
    href: "/dashboard/departments",
    icon: Building2,
  },
  {
    title: "CRM",
    tKey: "menu.crm",
    href: "/dashboard/crm",
    icon: Contact,
  },
  {
    title: "Mesajlar",
    tKey: "menu.messages",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
  {
    title: "Hesabatlar",
    tKey: "menu.reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
];

const adminItems = [
  {
    title: "Rollar & İcazələr",
    tKey: "menu.roles",
    href: "/dashboard/roles",
    icon: ShieldCheck,
  },
  {
    title: "Etiketlər",
    tKey: "menu.labels",
    href: "/dashboard/labels",
    icon: Tag,
  },
  {
    title: "Parametrlər",
    tKey: "menu.settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

// =============================================================================
// Sidebar Component
// =============================================================================
export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, collapse, expand } = useSidebarStore();

  // Sessiyadan dili oxuyuruq və tərcümə funksiyasını çağırırıq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]",
        "border-r border-[hsl(var(--sidebar-border))]",
        "transition-all duration-300 ease-in-out flex-shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo & Brand */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]",
          isCollapsed && "justify-center px-0"
        )}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[hsl(var(--sidebar-primary))] shadow-lg flex-shrink-0">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{t("menu.workspace") || "WorkSpace"}</p>
            <p className="text-xs text-[hsl(var(--sidebar-foreground)/0.5)] truncate">
              {t("menu.platform") || "ERP Platform"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {/* Main Nav */}
        <NavGroup
          items={navItems}
          isCollapsed={isCollapsed}
          isActive={isActive}
          label={t("menu.main") || "Əsas"}
          t={t}
        />

        {/* Divider */}
        <div className="my-3 mx-2 border-t border-[hsl(var(--sidebar-border))]" />

        {/* Admin Nav */}
        <NavGroup
          items={adminItems}
          isCollapsed={isCollapsed}
          isActive={isActive}
          label={t("menu.administration") || "Administrasiya"}
          t={t}
        />
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 pb-16 border-t border-[hsl(var(--sidebar-border))]">
        <button
          onClick={() => (isCollapsed ? expand() : collapse())}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
            "text-[hsl(var(--sidebar-foreground)/0.5)] hover:text-[hsl(var(--sidebar-foreground))]",
            "hover:bg-[hsl(var(--sidebar-accent))] transition-colors",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? (t("menu.expand") || "Genişlət") : (t("menu.collapse") || "Daralt")}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>{t("menu.collapse") || "Daralt"}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

// =============================================================================
// Nav Group — Label + Items
// =============================================================================
function NavGroup({
  items,
  isCollapsed,
  isActive,
  label,
  t,
}: {
  items: typeof navItems;
  isCollapsed: boolean;
  isActive: (href: string, exact?: boolean) => boolean;
  label: string;
  t: (key: string) => string;
}) {
  return (
    <div>
      {!isCollapsed && (
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/0.35)]">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, (item as any).exact);
          // Tərcümə açarı varsa lüğətdən oxuyur, yoxdursa orijinal title-ı saxlayır
          const displayTitle = item.tKey ? t(item.tKey) : item.title;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={isCollapsed ? displayTitle : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  isCollapsed && "justify-center px-0 py-2.5",
                  active
                    ? "bg-[hsl(var(--sidebar-primary)/0.15)] text-[hsl(var(--sidebar-primary))]"
                    : "text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
                )}
              >
                <Icon
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    isCollapsed ? "w-5 h-5" : "w-4 h-4",
                    active && "text-[hsl(var(--sidebar-primary))]"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate">{displayTitle}</span>
                )}
                {active && !isCollapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}