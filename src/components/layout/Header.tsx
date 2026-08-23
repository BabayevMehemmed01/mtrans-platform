"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, Search, CheckCheck, ListTodo, CalendarClock, MessageSquare, AtSign, UserPlus, PhoneIncoming } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useCommandPaletteStore } from "@/store/useCommandPaletteStore";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { getTranslation } from "@/lib/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// Bildiriş növünə görə ikon və rəng — dropdown-da tez oxunması üçün
const NOTIF_TYPE_META: Record<string, { icon: typeof Bell; className: string }> = {
  TASK_ASSIGNED: { icon: ListTodo, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  TASK_STATUS_CHANGED: { icon: ListTodo, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  DEADLINE_APPROACHING: { icon: CalendarClock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  MENTION: { icon: AtSign, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  COMMENT_REPLY: { icon: MessageSquare, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  COMMENT_ADDED: { icon: MessageSquare, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  INVITE: { icon: UserPlus, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  CALL_INCOMING: { icon: PhoneIncoming, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

function NotificationIcon({ type }: { type: string }) {
  const meta = NOTIF_TYPE_META[type] ?? { icon: Bell, className: "bg-muted text-muted-foreground" };
  const Icon = meta.icon;
  return (
    <span className={cn("flex size-7 flex-shrink-0 items-center justify-center rounded-full", meta.className)}>
      <Icon className="size-3.5" />
    </span>
  );
}

// =============================================================================
// Breadcrumb helper — URL path-i oxunaqlı ada çevirir (Tərcümə ilə)
// =============================================================================
// "Mənim İşlərim" alt-tablarının seqment adından tərcümə açarına uyğunlaşdırılması
const MY_WORK_TAB_KEYS: Record<string, string> = {
  tasks: "menu.myWorkTasks",
  calendar: "menu.myWorkCalendar",
  timesheet: "menu.myWorkTimesheet",
  projects: "menu.myWorkProjects",
  activity: "menu.myWorkActivity",
  dashboards: "menu.myWorkDashboards",
};

function useBreadcrumbs(t: (key: string) => string) {
  const pathname = usePathname();
  // "Ana Səhifə" konsepti ləğv edilib — kök "dashboard" seqmentini breadcrumb-da göstərmirik,
  // lakin link-lər hələ də /dashboard prefiksinə ehtiyac duyur.
  const rawSegments = pathname.split("/").filter(Boolean);
  const hasDashboardPrefix = rawSegments[0] === "dashboard";
  const segments = hasDashboardPrefix ? rawSegments.slice(1) : rawSegments;
  const basePrefix = hasDashboardPrefix ? "/dashboard" : "";

  const buildHref = (uptoIndex: number) =>
    basePrefix + "/" + segments.slice(0, uptoIndex + 1).join("/");

  return segments.map((seg, i) => {
    // Əgər seqment "my-work" alt-tabıdırsa, uyğun tərcümə açarından oxunur.
    // Tapılmazsa seqmentin özünü böyük hərflə yazacaq.
    if (segments[i - 1] === "my-work" && MY_WORK_TAB_KEYS[seg]) {
      const tabKey = MY_WORK_TAB_KEYS[seg];
      return {
        label: t(tabKey) !== tabKey ? t(tabKey) : seg,
        href: buildHref(i),
        isLast: i === segments.length - 1,
      };
    }

    const transKey = seg === "my-work" ? "myWork" : seg;
    const label = t(`menu.${transKey}`) !== `menu.${transKey}` ? t(`menu.${transKey}`) : seg;

    return {
      label,
      href: buildHref(i),
      isLast: i === segments.length - 1,
    };
  });
}

// =============================================================================
// Header Component
// =============================================================================
export function Header() {
  const { data: session } = useSession();
  
  // YENİ: Dili sessiyadan tapırıq və tərcümə obyektini (t) yaradırıq
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  
  const breadcrumbs = useBreadcrumbs(t);
  const router = useRouter();

  const [notifOpen, setNotifOpen] = useState(false);
  const { setOpen: setPaletteOpen } = useCommandPaletteStore();

  // Real-time bildirişlərin SWR ilə çəkilməsi (hər 15 saniyədən bir)
  const { data: notifData, mutate: mutateNotifications } = useSWR<{
    notifications: NotificationItem[];
    unreadCount: number;
  }>("/api/notifications", fetcher, { refreshInterval: 15000 });

  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  const user = session?.user;

  // İstifadəçi rolu məlumatının formatlanması
  const roleName = typeof (user as any)?.role === "string"
    ? (user as any).role
    : ((user as any)?.role?.name ?? (t("header.defaultRole") || "İstifadəçi"));

  // Bildirişə kliklədikdə oxunmuş edilməsi və müvafiq səhifəyə keçid.
  // "virtual-" prefiksli bildirişlər DB-də saxlanılmır (canlı sintez olunub),
  // ona görə onlar üçün tək-tək "oxunmuş et" sorğusu göndərmirik.
  const handleNotificationClick = async (notif: NotificationItem) => {
    setNotifOpen(false);
    if (!notif.isRead && !notif.id.startsWith("virtual-")) {
      fetch(`/api/notifications/${notif.id}`, { method: "PATCH" }).then(() =>
        mutateNotifications()
      );
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    await mutateNotifications();
  };

  const renderNotificationList = (items: NotificationItem[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <Bell className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      );
    }

    return items.map((notif) => (
      <button
        key={notif.id}
        type="button"
        onClick={() => handleNotificationClick(notif)}
        className={cn(
          "flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-accent",
          !notif.isRead && "bg-primary/5"
        )}
      >
        <NotificationIcon type={notif.type} />
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-snug text-foreground">
            {notif.message}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {timeAgo(notif.createdAt)}
          </p>
        </div>
        {!notif.isRead && (
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
        )}
      </button>
    ));
  };

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 gap-4 bg-card border-b border-border backdrop-blur-sm">
      {/* ─── Breadcrumb Naviqasiyası ─── */}
      <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-muted-foreground">/</span>
            )}
            {crumb.isLast ? (
              <span className="truncate font-semibold text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* ─── Qlobal Axtarış Düyməsi (Command Palette Trigger) ─── */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent transition-colors min-w-[200px] hidden md:flex"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">{t("header.search") || "Axtar..."}</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">
          ⌘K
        </kbd>
      </button>

      {/* ─── Bildirişlər Bölməsi ─── */}
      <Popover open={notifOpen} onOpenChange={(open) => setNotifOpen(Boolean(open))}>
        <PopoverTrigger
          type="button"
          className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          title={t("header.notifications") || "Bildirişlər"}
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
          )}
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-80 gap-0 p-0">
          <div className="flex items-center justify-between border-b border-border p-3">
            <p className="text-sm font-semibold">{t("header.notifications") || "Bildirişlər"}</p>
            {unreadNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t("header.markAllRead") || "Hamısını oxunmuş kimi qeyd et"}
              </button>
            )}
          </div>
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger
                value="unread"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                {t("header.recentNotifications") || "Son Bildirişlər"}
              </TabsTrigger>
              <TabsTrigger
                value="read"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                {t("header.readNotifications") || "Oxunmuşlar"}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="unread" className="mt-0 max-h-80 overflow-y-auto custom-scrollbar">
              {renderNotificationList(
                unreadNotifications,
                t("header.noUnreadNotifications") || "Oxunmamış bildiriş yoxdur"
              )}
            </TabsContent>
            <TabsContent value="read" className="mt-0 max-h-80 overflow-y-auto custom-scrollbar">
              {renderNotificationList(
                readNotifications,
                t("header.noReadNotifications") || "Oxunmuş bildiriş yoxdur"
              )}
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* ─── Sağ Yuxarı: İstifadəçi Profili və Ayarlar Menyu Kompleksi ─── */}
      <UserProfileDropdown
        user={{
          name: user?.name || (t("header.defaultRole") || "İstifadəçi"),
          email: user?.email || "Email qeyd edilməyib",
          role: roleName,
          avatar: user?.image || undefined,
        }}
      />
    </header>
  );
}