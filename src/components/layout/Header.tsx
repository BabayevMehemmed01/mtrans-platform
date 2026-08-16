"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, Search, CheckCheck } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useCommandPaletteStore } from "@/store/useCommandPaletteStore";
import { UserProfileDropdown } from "./UserProfileDropdown";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// =============================================================================
// Breadcrumb helper — URL path-i oxunaqlı ada çevirir
// =============================================================================
const routeLabels: Record<string, string> = {
  dashboard: "Ana Səhifə",
  projects: "Layihələr",
  tasks: "Tapşırıqlar",
  members: "Komanda",
  departments: "Şöbələr",
  reports: "Hesabatlar",
  roles: "Rollar & İcazələr",
  labels: "Etiketlər",
  settings: "Parametrlər",
  collab: "Collab (Ortaq)",
  crm: "CRM",
  chat: "Mesajlar",
  "my-work": "Mənim İşlərim",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: routeLabels[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

// =============================================================================
// Header Component
// =============================================================================
export function Header() {
  const { data: session } = useSession();
  const breadcrumbs = useBreadcrumbs();
  const router = useRouter();

  // Bildiriş pəncərəsi və Axtarış modulu üçün state-lər
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const { setOpen: setPaletteOpen } = useCommandPaletteStore();

  // Real-time bildirişlərin SWR ilə çəkilməsi (hər 15 saniyədən bir)
  const { data: notifData, mutate: mutateNotifications } = useSWR<{
    notifications: NotificationItem[];
    unreadCount: number;
  }>("/api/notifications", fetcher, { refreshInterval: 15000 });

  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;

  const user = session?.user;

  // İstifadəçi rolu məlumatının formatlanması
  const roleName = typeof (user as any)?.role === "string"
    ? (user as any).role
    : ((user as any)?.role?.name ?? "İstifadəçi");

  // Bildirişə kliklədikdə oxunmuş edilməsi və müvafiq səhifəyə keçid
  const handleNotificationClick = async (notif: NotificationItem) => {
    setNotifMenuOpen(false);
    if (!notif.isRead) {
      fetch(`/api/notifications/${notif.id}`, { method: "PATCH" }).then(() =>
        mutateNotifications()
      );
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // Bütün bildirişləri oxunmuş kimi qeyd etmək
  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    mutateNotifications();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 gap-4 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] backdrop-blur-sm">
      {/* ─── Breadcrumb Naviqasiyası ─── */}
      <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-[hsl(var(--muted-foreground))]">/</span>
            )}
            <span
              className={cn(
                "truncate",
                crumb.isLast
                  ? "font-semibold text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* ─── Qlobal Axtarış Düyməsi (Command Palette Trigger) ─── */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] transition-colors min-w-[200px] hidden md:flex"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Axtar...</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[hsl(var(--muted))] rounded border border-[hsl(var(--border))]">
          ⌘K
        </kbd>
      </button>

      {/* ─── Bildirişlər Bölməsi ─── */}
      <div className="relative">
        <button
          onClick={() => setNotifMenuOpen((prev) => !prev)}
          className="relative p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
          title="Bildirişlər"
        >
          <Bell className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[hsl(var(--destructive))] rounded-full ring-2 ring-[hsl(var(--card))]" />
          )}
        </button>

        {notifMenuOpen && (
          <>
            {/* Arxa fon örtüyü (Klikləyəndə bağlanması üçün) */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setNotifMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-40 w-80 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl animate-scale-in overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-[hsl(var(--border))]">
                <p className="text-sm font-semibold">Bildirişlər</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Hamısını oxunmuş et
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-center text-[hsl(var(--muted-foreground))]">
                    Bildiriş yoxdur
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--accent))] transition-colors",
                        !notif.isRead && "bg-[hsl(var(--primary)/0.05)]"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.isRead && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] flex-shrink-0" />
                        )}
                        <div className={cn("min-w-0", notif.isRead && "pl-3.5")}>
                          <p className="text-xs text-[hsl(var(--foreground))] leading-snug">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Sağ Yuxarı: İstifadəçi Profili və Ayarlar Menyu Kompleksi ─── */}
      <UserProfileDropdown
        user={{
          name: user?.name || "İstifadəçi",
          email: user?.email || "Email qeyd edilməyib",
          role: roleName,
          avatar: user?.image || undefined,
        }}
      />
    </header>
  );
}