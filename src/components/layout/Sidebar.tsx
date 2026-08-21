"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/useSidebarStore";
import { getTranslation } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
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
  Tag,
  CircleUser,
  Contact,
  MessageSquare,
  Network,
  ListTodo,
  Clock,
  Calendar as CalendarIcon,
  Archive,
  ScrollText,
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
};

const navItems: NavItem[] = [
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
    children: [
      {
        title: "My tasks",
        tKey: "",
        href: "/dashboard/my-work/tasks",
        icon: ListTodo,
      },
      {
        title: "My calendar",
        tKey: "",
        href: "/dashboard/my-work/calendar",
        icon: CalendarIcon,
      },
      {
        title: "My timesheet",
        tKey: "",
        href: "/dashboard/my-work/timesheet",
        icon: Clock,
      },
      {
        title: "My projects",
        tKey: "",
        href: "/dashboard/my-work/projects",
        icon: FolderKanban,
      },
      {
        title: "Activity",
        tKey: "",
        href: "/dashboard/my-work/activity",
        icon: Archive,
      },
      {
        title: "Dashboards",
        tKey: "",
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

const adminItems: NavItem[] = [
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
      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
  );
}

// =============================================================================
// Sidebar Component
// =============================================================================
export function Sidebar() {
  return (
    <Suspense fallback={<aside className="h-screen w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-zinc-950" />}>
      <SidebarInner />
    </Suspense>
  );
}

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed, collapse, expand } = useSidebarStore();

  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const currentView = searchParams.get("view");
  const isSuperAdmin =
    Boolean((session?.user as any)?.isSuperAdmin) ||
    (((session?.user as any)?.role?.permissions as string[] | undefined) ?? []).includes(
      "CAN_MANAGE_COMPANY"
    ) ||
    String((session?.user as any)?.role?.name ?? "")
      .toUpperCase()
      .includes("SUPER");
  const visibleAdminItems = adminItems.filter((item) => !item.superAdminOnly || isSuperAdmin);

  const isActive = (href: string, exact = false) => {
    const { path, view } = parseHref(href);
    if (view) {
      return pathname === path && currentView === view;
    }
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-shrink-0 flex-col bg-white text-gray-900 dark:bg-zinc-950 dark:text-gray-100",
        "border-r border-gray-200 dark:border-gray-800",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 border-b border-gray-200 px-4 py-5 transition-all dark:border-gray-800",
          isCollapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 shadow-sm dark:bg-white">
          <Briefcase className="h-4 w-4 text-white dark:text-gray-900" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {t("menu.workspace") || "WorkSpace"}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {t("menu.platform") || "ERP Platform"}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        <NavGroup
          items={navItems}
          isCollapsed={isCollapsed}
          isActive={isActive}
          label={t("menu.main") || "Əsas"}
          t={t}
        />

        <div className="mx-2 my-3 border-t border-gray-200 dark:border-gray-800" />

        <NavGroup
          items={visibleAdminItems}
          isCollapsed={isCollapsed}
          isActive={isActive}
          label={t("menu.administration") || "Administrasiya"}
          t={t}
        />
      </nav>

      <div className="border-t border-gray-200 p-2 pb-16 dark:border-gray-800">
        <button
          onClick={() => (isCollapsed ? expand() : collapse())}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all",
            "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
            "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? t("menu.expand") || "Genişlət" : t("menu.collapse") || "Daralt"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
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
  items: NavItem[];
  isCollapsed: boolean;
  isActive: (href: string, exact?: boolean) => boolean;
  label: string;
  t: (key: string) => string;
}) {
  return (
    <div>
      {!isCollapsed && (
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
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
              />
            ) : (
              <NavLink item={item} isCollapsed={isCollapsed} isActive={isActive} t={t} />
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
}: {
  item: NavItem | NavChild;
  isCollapsed: boolean;
  isActive: (href: string, exact?: boolean) => boolean;
  t: (key: string) => string;
}) {
  const Icon = item.icon;
  const active = isActive(item.href, "exact" in item ? item.exact : false);
  const displayTitle = item.tKey ? t(item.tKey) : item.title;

  return (
    <Link
      href={item.href}
      title={isCollapsed ? displayTitle : undefined}
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
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: (href: string, exact?: boolean) => boolean;
  t: (key: string) => string;
}) {
  const Icon = item.icon;
  const displayTitle = item.tKey ? t(item.tKey) : item.title;
  const childActive = item.children?.some((child) => isActive(child.href)) ?? false;
  const groupActive = childActive || isActive(item.href);
  const [open, setOpen] = useState(true);

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
            <Link href={item.href} className="flex cursor-pointer items-center gap-2">
              <Icon className="h-4 w-4 text-gray-500" />
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
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "flex items-center rounded-md text-sm font-medium transition-all duration-200",
          groupActive
            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        )}
      >
        <Link
          href={item.href}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2"
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{displayTitle}</span>
        </Link>
        <Collapsible.Trigger
          type="button"
          aria-label="Toggle submenu"
          className="flex h-9 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
        <ul className="ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-2 dark:border-gray-800">
          {item.children?.map((child) => (
            <li key={child.href}>
              <SubNavLink child={child} isActive={isActive} t={t} />
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
}: {
  child: NavChild;
  isActive: (href: string, exact?: boolean) => boolean;
  t: (key: string) => string;
  collapsed?: boolean;
}) {
  const ChildIcon = child.icon;
  const childTitle = child.tKey ? t(child.tKey) : child.title;
  const active = isActive(child.href);

  if (collapsed) {
    return (
      <DropdownMenuItem asChild>
        <Link href={child.href} className="flex cursor-pointer items-center gap-2">
          <ChildIcon className="h-4 w-4 text-gray-500" />
          {childTitle}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <Link
      href={child.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200",
        active
          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      )}
    >
      <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">{childTitle}</span>
    </Link>
  );
}
