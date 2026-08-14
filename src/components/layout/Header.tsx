"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bell, Search, LogOut, User, Settings, ChevronDown, CheckCheck } from "lucide-react";
import { getInitials, timeAgo } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { useCommandPaletteStore } from "@/store/useCommandPaletteStore";

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
// Breadcrumb helper — URL path-i oxunaqlı ad-a çevirir
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const { setOpen: setPaletteOpen } = useCommandPaletteStore();

  const { data: notifData, mutate: mutateNotifications } = useSWR<{
    notifications: NotificationItem[];
    unreadCount: number;
  }>("/api/notifications", fetcher, { refreshInterval: 15000 });

  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;

  const user = session?.user;
  const roleName = (user as any)?.role?.name ?? "İstifadəçi";
  const roleColor = (user as any)?.role?.color ?? "#6366f1";

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

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    mutateNotifications();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 gap-4 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] backdrop-blur-sm">
      {/* Breadcrumb */}
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

      {/* Search Button */}
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

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifMenuOpen((prev) => !prev)}
          className="relative p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
        >
          <Bell className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[hsl(var(--destructive))] rounded-full ring-2 ring-[hsl(var(--card))]" />
          )}
        </button>

        {notifMenuOpen && (
          <>
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
              <div className="max-h-80 overflow-y-auto">
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

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: roleColor }}>
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? ""} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(user?.name ?? "U")
            )}
          </div>
          {/* Name + Role */}
          <div className="hidden md:block text-left min-w-0">
            <p className="text-xs font-semibold leading-none truncate max-w-[120px]">
              {user?.name}
            </p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate max-w-[120px] mt-0.5">
              {roleName}
            </p>
          </div>
          <ChevronDown className="w-3 h-3 text-[hsl(var(--muted-foreground))] hidden md:block" />
        </button>

        {/* Dropdown */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setUserMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-40 w-52 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl animate-scale-in overflow-hidden">
              <div className="p-3 border-b border-[hsl(var(--border))]">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <DropdownItem icon={User} label="Profilim" href="/dashboard/profile" onClick={() => setUserMenuOpen(false)} />
                <DropdownItem icon={Settings} label="Parametrlər" href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} />
              </div>
              <div className="p-1 border-t border-[hsl(var(--border))]">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.08)] rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Çıxış
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
    >
      <Icon className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
      {label}
    </a>
  );
}
