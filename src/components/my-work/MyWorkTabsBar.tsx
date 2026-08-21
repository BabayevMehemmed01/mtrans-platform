"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  Check,
  ListTodo,
  Calendar,
  Clock,
  FolderKanban,
  Activity,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

// =============================================================================
// My Work — Top tab navigation (Teamwork "My Work" style)
// Real Next.js routes under /dashboard/my-work/* — Link-based for fast nav.
// =============================================================================

export const MY_WORK_TABS = [
  { id: "tasks", label: "Tapşırıqlarım", href: "/dashboard/my-work/tasks", icon: ListTodo },
  { id: "calendar", label: "Təqvimim", href: "/dashboard/my-work/calendar", icon: Calendar },
  { id: "timesheet", label: "Vaxt Cədvəlim", href: "/dashboard/my-work/timesheet", icon: Clock },
  { id: "projects", label: "Layihələrim", href: "/dashboard/my-work/projects", icon: FolderKanban },
  { id: "activity", label: "Fəaliyyət", href: "/dashboard/my-work/activity", icon: Activity },
  { id: "dashboards", label: "İdarə Panelləri", href: "/dashboard/my-work/dashboards", icon: LayoutDashboard },
] as const;

export type MyWorkStats = { late: number; today: number; upcoming: number };

export function MyWorkTabsBar({ stats }: { stats: MyWorkStats }) {
  const pathname = usePathname();

  return (
    <div className="relative z-20 flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {MY_WORK_TABS.map((tab) => {
          const isActive = pathname?.startsWith(tab.href) ?? false;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-all",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="relative z-50 flex flex-shrink-0 items-center gap-2 py-2">
        <Popover>
          <PopoverTrigger
            className="flex size-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Bölmələri əlavə et / sil"
          >
            <Plus className="size-4" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            className="z-50 w-64 rounded-md bg-card shadow-xl"
          >
            <PopoverHeader>
              <PopoverTitle>Bölmələri əlavə et / sil</PopoverTitle>
              <PopoverDescription>Mənim İşim bölməsində görünəcək bölmələri seçin.</PopoverDescription>
            </PopoverHeader>
            <div className="flex flex-col gap-0.5">
              {MY_WORK_TABS.map((tab) => (
                <div
                  key={tab.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground"
                >
                  <Check className="size-3.5 text-emerald-600" />
                  <span>{tab.label}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <StatBadge
          count={stats.late}
          label="Gecikən"
          className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        />
        <StatBadge
          count={stats.today}
          label="Bugün"
          className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
        />
        <StatBadge
          count={stats.upcoming}
          label="Gələcək"
          className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        />
      </div>
    </div>
  );
}

function StatBadge({
  count,
  label,
  className,
}: {
  count: number;
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      <span className="tabular-nums">{count}</span>
      {label}
    </span>
  );
}
