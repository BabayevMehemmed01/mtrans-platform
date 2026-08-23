"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/useSidebarStore";
import { getTranslation } from "@/lib/i18n";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderKanban,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Briefcase,
  BarChart3,
  CircleUser,
  Contact,
  MessageSquare,
  Network,
  ListTodo,
  Clock,
  Calendar as CalendarIcon,
  Archive,
  ScrollText,
  Megaphone,
  Boxes,
  type LucideIcon,
} from "lucide-react";

// =============================================================================
// Navigasiya Linkləri (tKey əlavə olundu)
// =============================================================================
type NavChild = {
  title: string;
  tKey: string;
  href: string;
  icon: LucideIcon;
};

type NavItem = {
  title: string;
  tKey: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  children?: NavChild[];
  superAdminOnly?: boolean;
  // Bu sahələrdən ƏN AZI biri JWT-dəki rol icazələrində olmalıdır (soft-gate;
  // əsl qorunma hər zaman server-side, bax: src/lib/permissions.ts).
  requiresAnyPermission?: string[];
};

const navItems: NavItem[] = [
  {
    title: "Mənim İşlərim",
    tKey: "menu.myWork",
    href: "/dashboard/my-work",
    icon: CircleUser,
    children: [
      {
        title: "Tapşırıqlarım",
        tKey: "menu.myWorkTasks",
        href: "/dashboard/my-work/tasks",
        icon: ListTodo,
      },
      {
        title: "Təqvimim",
        tKey: "menu.myWorkCalendar",
        href: "/dashboard/my-work/calendar",
        icon: CalendarIcon,
      },
      {
        title: "Vaxt Cədvəlim",
        tKey: "menu.myWorkTimesheet",
        href: "/dashboard/my-work/timesheet",
        icon: Clock,
      },
      {
        title: "Layihələrim",
        tKey: "menu.myWorkProjects",
        href: "/dashboard/my-work/projects",
        icon: FolderKanban,
      },
      {
        title: "Fəaliyyət",
        tKey: "menu.myWorkActivity",
        href: "/dashboard/my-work/activity",
        icon: Archive,
      },
      {
        title: "Dashboardlar",
        tKey: "menu.myWorkDashboards",
        href: "/dashboard/my-work/dashboards",
        icon: BarChart3,
      },
    ],
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
    requiresAnyPermission: ["CAN_VIEW_CRM", "CAN_MANAGE_CRM"],
  },
  {
    title: "Marketinq",
    tKey: "menu.marketing",
    href: "/dashboard/marketing",
    icon: Megaphone,
    requiresAnyPermission: ["CAN_VIEW_MARKETING", "CAN_MANAGE_MARKETING"],
  },
  {
    title: "Anbar (WMS)",
    tKey: "menu.inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
    requiresAnyPermission: ["CAN_VIEW_WMS", "CAN_MANAGE_WMS"],
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
    // TƏHLÜKƏSİZLİK: Real qorunma server-side-dır (bax: /dashboard/reports/page.tsx),
    // bu yalnız linkin lazımsız yerə göstərilməsinin qarşısını alan soft-gate-dir.
    requiresAnyPermission: ["CAN_VIEW_REPORTS", "CAN_VIEW_FINANCE"],
  },
];

const adminItems: NavItem[] = [
  {
    title: "Rollar & İcazələr",
    tKey: "menu.roles",
    href: "/dashboard/roles",
    icon: ShieldCheck,
    requiresAnyPermission: ["CAN_VIEW_ROLES", "CAN_EDIT_ROLE", "CAN_CREATE_ROLE"],
  },
  {
    title: "Sistem Qeydləri",
    tKey: "menu.activityLogs",
    href: "/dashboard/activity-logs",
    icon: ScrollText,
    superAdminOnly: true,
  },
  {
    title: "Parametrlər",
    tKey: "menu.settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function parseHref(href: string) {
  const [path, query] = href.split("?");
  const view = query ? new URLSearchParams(query).get("view") : null;
  return { path, view };
}

function itemClassName(active: boolean, collapsed: boolean) {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
    collapsed && "justify-center px-0",
    active
      ? "bg-sidebar-accent text-sidebar-primary"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
  );
}

// =============================================================================
// Sidebar Component
// =============================================================================
export function Sidebar() {
  return (
    <Suspense fallback={<aside className="h-screen w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar" />}>
      <SidebarInner />
    </Suspense>
  );
}

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed, isOpen, setOpen, collapse, expand } = useSidebarStore();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, [setOpen]);

  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const currentView = searchParams.get("view");
  const userPermissions = ((session?.user as any)?.role?.permissions as string[] | undefined) ?? [];
  const isSuperAdmin =
    Boolean((session?.user as any)?.isSuperAdmin) ||
    userPermissions.includes("CAN_MANAGE_COMPANY") ||
    String((session?.user as any)?.role?.name ?? "")
      .toUpperCase()
      .includes("SUPER");
  const filterByAccess = (item: NavItem) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.requiresAnyPermission && !isSuperAdmin) {
      return item.requiresAnyPermission.some((p) => userPermissions.includes(p));
    }
    return true;
  };
  const visibleNavItems = navItems.filter(filterByAccess);
  const visibleAdminItems = adminItems.filter(filterByAccess);

  const isActive = (href: string, exact = false) => {
    const { path, view } = parseHref(href);
    if (view) {
      return pathname === path && currentView === view;
    }
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const chrome = (opts: { collapsed: boolean; onNavigate?: () => void; showToggle?: boolean }) => (
    <>
      <div
        className={cn(
          "flex items-center gap-3 border-b border-sidebar-border px-4 py-5 transition-all",
          opts.collapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-primary shadow-sm">
          <Briefcase className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!opts.collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {t("menu.workspace") || "WorkSpace"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {t("menu.platform") || "ERP Platform"}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        <NavGroup
          items={visibleNavItems}
          isCollapsed={opts.collapsed}
          isActive={isActive}
          label={t("menu.main") || "Əsas"}
          t={t}
          onNavigate={opts.onNavigate}
        />

        <div className="mx-2 my-3 border-t border-sidebar-border" />

        <NavGroup
          items={visibleAdminItems}
          isCollapsed={opts.collapsed}
          isActive={isActive}
          label={t("menu.administration") || "Administrasiya"}
          t={t}
          onNavigate={opts.onNavigate}
        />
      </nav>

      {opts.showToggle !== false && (
        <div className="border-t border-sidebar-border p-2 pb-16">
          <button
            onClick={() => (isCollapsed ? expand() : collapse())}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all",
              "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              opts.collapsed && "justify-center"
            )}
            title={isCollapsed ? t("menu.expand") || "Genişlət" : t("menu.collapse") || "Daralt"}
          >
            {opts.collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>{t("menu.collapse") || "Daralt"}</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex",
          "border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {chrome({ collapsed: isCollapsed })}
      </aside>

      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex h-full w-72 flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs md:hidden"
        >
          <SheetTitle className="sr-only">{t("header.menu") || "Menyu"}</SheetTitle>
          {chrome({ collapsed: false, onNavigate: () => setOpen(false), showToggle: false })}
        </SheetContent>
      </Sheet>
    </>
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
  onNavigate,
}: {
  items: NavItem[];
  isCollapsed: boolean;
  isActive: (href: string, exact?: boolean) => boolean;
  label: string;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      {!isCollapsed && (
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.href}>
            {item.children?.length ? (
              <CollapsibleNavItem
                item={item}
                isCollapsed={isCollapsed}
                isActive={isActive}
                t={t}
                onNavigate={onNavigate}
              />
            ) : (
              <NavLink item={item} isCollapsed={isCollapsed} isActive={isActive} t={t} onNavigate={onNavigate} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavLink({
  item,
  isCollapsed,
  isActive,
  t,
  onNavigate,
}: {
  item: NavItem | NavChild;
  isCollapsed: boolean;
  isActive: (href: string, exact?: boolean) => boolean;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = isActive(item.href, "exact" in item ? item.exact : false);
  const displayTitle = item.tKey ? t(item.tKey) : item.title;

  return (
    <Link
      href={item.href}
      title={isCollapsed ? displayTitle : undefined}
      onClick={onNavigate}
      className={itemClassName(active, isCollapsed)}
    >
      <Icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
      {!isCollapsed && <span className="truncate">{displayTitle}</span>}
    </Link>
  );
}

function CollapsibleNavItem({
  item,
  isCollapsed,
  isActive,
  t,
  onNavigate,
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: (href: string, exact?: boolean) => boolean;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const displayTitle = item.tKey ? t(item.tKey) : item.title;
  const childActive = item.children?.some((child) => isActive(child.href)) ?? false;
  const groupActive = childActive || isActive(item.href);
  const [open, setOpen] = useState(groupActive);
  const primaryHref = item.href === "/dashboard/my-work" ? "/dashboard/my-work/tasks" : item.children?.[0]?.href ?? item.href;

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            title={displayTitle}
            className={cn(itemClassName(groupActive, true), "w-full")}
          >
            <Icon className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={primaryHref} onClick={onNavigate} className="flex cursor-pointer items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {displayTitle}
            </Link>
          </DropdownMenuItem>
          {item.children?.map((child) => (
            <SubNavLink
              key={child.href}
              child={child}
              isActive={isActive}
              t={t}
              collapsed
              onNavigate={onNavigate}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!groupActive) setOpen(false);
      }}
    >
      <div
        className={cn(
          "flex items-center rounded-md text-sm font-medium transition-all duration-200",
          groupActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <Link
          href={primaryHref}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2"
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{displayTitle}</span>
        </Link>
        <Collapsible.Trigger
          type="button"
          aria-label={t("menu.toggleSubmenu") || "Alt menyunu aç/bağla"}
          className="flex h-9 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-out data-[state=open]:animate-in">
        <ul className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-2">
          {item.children?.map((child) => (
            <li key={child.href}>
              <SubNavLink child={child} isActive={isActive} t={t} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function SubNavLink({
  child,
  isActive,
  t,
  collapsed = false,
  onNavigate,
}: {
  child: NavChild;
  isActive: (href: string, exact?: boolean) => boolean;
  t: (key: string) => string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const ChildIcon = child.icon;
  const childTitle = child.tKey ? t(child.tKey) : child.title;
  const active = isActive(child.href);

  if (collapsed) {
    return (
      <DropdownMenuItem asChild>
        <Link href={child.href} onClick={onNavigate} className="flex cursor-pointer items-center gap-2">
          <ChildIcon className="h-4 w-4 text-muted-foreground" />
          {childTitle}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <Link
      href={child.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200",
        active
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">{childTitle}</span>
    </Link>
  );
}
