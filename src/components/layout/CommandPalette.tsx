"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import { useCommandPaletteStore } from "@/store/useCommandPaletteStore";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FolderKanban,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  BarChart3,
  CircleUser,
  Contact,
  MessageSquare,
  PlusCircle,
  Loader2,
  CheckSquare,
  UserRound,
  Layers,
  Calendar,
} from "lucide-react";

// =============================================================================
// Command Palette — Cmd+K / Ctrl+K qlobal, "Context-Aware" axtarış paneli
//
// - Boş sorğuda: cari səhifəyə uyğun sürətli əməliyyatlar + qlobal naviqasiya
// - Yazı yazılanda: /api/search vasitəsilə server üzərində layihə, tapşırıq,
//   komanda üzvü və şöbə axtarışı (debounce ilə), nəticələr kontekstə görə
//   qruplaşdırılır (məs. cari layihə daxilində olsan həmin tapşırıqlar öndə gəlir)
// =============================================================================

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: "Mənim İşlərim", href: "/dashboard/my-work", icon: CircleUser },
  { title: "Layihələr", href: "/dashboard/projects", icon: FolderKanban },
  { title: "Komanda", href: "/dashboard/members", icon: Users },
  { title: "Şöbələr", href: "/dashboard/departments", icon: Building2 },
  { title: "CRM", href: "/dashboard/crm", icon: Contact },
  { title: "Mesajlar", href: "/dashboard/chat", icon: MessageSquare },
  { title: "Hesabatlar", href: "/dashboard/reports", icon: BarChart3 },
];

const adminItems: NavItem[] = [
  { title: "Rollar & İcazələr", href: "/dashboard/roles", icon: ShieldCheck },
  { title: "Parametrlər", href: "/dashboard/settings", icon: Settings },
];

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "project" | "task" | "member" | "department";
  meta?: string;
  avatar?: string | null;
}

interface SearchGroup {
  id: string;
  label: string;
  items: SearchResultItem[];
}

const TYPE_ICON: Record<SearchResultItem["type"], React.ComponentType<{ className?: string }>> = {
  project: FolderKanban,
  task: CheckSquare,
  member: UserRound,
  department: Layers,
};

/** Cari pathname-dən layihə ID-sini çıxarır (kontekst-aware axtarış üçün) */
function extractProjectId(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const match = pathname.match(/^\/dashboard\/(?:projects|collab)\/([^/]+)/);
  return match?.[1];
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  const { open, setOpen, toggle } = useCommandPaletteStore();

  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const contextProjectId = useMemo(() => extractProjectId(pathname), [pathname]);

  // Palet bağlanan kimi vəziyyəti sıfırlayırıq ki, növbəti açılışda köhnə nəticə görünməsin.
  // `open` bir zustand store-dan gəldiyi (bir neçə fərqli mənbədən — Cmd+K, overlay klik,
  // seçim — dəyişə bildiyi) üçün render zamanı "əvvəlki dəyərlə müqayisə et" pattern-i
  // (React-in rəsmi tövsiyəsi) istifadə olunur, useEffect əvəzinə.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setQuery("");
      setGroups([]);
      setLoading(false);
    }
  }

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

  // Server-side axtarış (debounce ilə)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 1) {
      // Axtarış xanası təmizlənəndə əvvəlki nəticələri dərhal sıfırlamaq lazımdır (debounce gözləmədən)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const myRequestId = ++requestIdRef.current;
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (contextProjectId) params.set("project", contextProjectId);
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        if (myRequestId === requestIdRef.current) {
          setGroups(data.groups ?? []);
        }
      } catch {
        if (myRequestId === requestIdRef.current) setGroups([]);
      } finally {
        if (myRequestId === requestIdRef.current) setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, contextProjectId]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  // Boş sorğuda göstərilən, cari səhifəyə uyğun sürətli əməliyyatlar
  const contextActions = useMemo(() => {
    if (!pathname) return [];
    const actions: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [];

    if (contextProjectId) {
      actions.push({
        label: "Bu layihədə tapşırıqlara bax",
        href: `${pathname.startsWith("/dashboard/collab") ? "/dashboard/collab" : "/dashboard/projects"}/${contextProjectId}?tab=list`,
        icon: CheckSquare,
      });
      actions.push({
        label: "Bu layihənin təqvimi",
        href: `${pathname.startsWith("/dashboard/collab") ? "/dashboard/collab" : "/dashboard/projects"}/${contextProjectId}?tab=calendar`,
        icon: Calendar,
      });
    } else if (pathname.includes("/dashboard/projects")) {
      actions.push({ label: "Yeni Layihə Yarat", href: "/dashboard/projects/new", icon: PlusCircle });
    } else if (pathname.includes("/dashboard/members")) {
      actions.push({ label: "Yeni Üzv Dəvət Et", href: "/dashboard/members", icon: PlusCircle });
    } else if (pathname.includes("/dashboard/my-work")) {
      actions.push({ label: "Bu günün tapşırıqları", href: "/dashboard/my-work/tasks", icon: CheckSquare });
      actions.push({ label: "Təqvimə bax", href: "/dashboard/my-work/calendar", icon: Calendar });
    }

    return actions;
  }, [pathname, contextProjectId]);

  const filteredNavItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter((item) => item.title.toLowerCase().includes(q));
  }, [query]);

  const filteredAdminItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return adminItems;
    return adminItems.filter((item) => item.title.toLowerCase().includes(q));
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const hasAnyResults =
    filteredNavItems.length > 0 || filteredAdminItems.length > 0 || groups.some((g) => g.items.length > 0);

  if (typeof open === "undefined") return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("header.commandPlaceholder") || "Layihə, tapşırıq, insan axtarın..."}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Axtarılır...
          </div>
        )}

        {!loading && !hasAnyResults && (
          <CommandEmpty>Nəticə tapılmadı.</CommandEmpty>
        )}

        {/* 1. Kontekst-aware sürətli əməliyyatlar (yalnız boş sorğuda) */}
        {!hasQuery && contextActions.length > 0 && (
          <CommandGroup heading="Sürətli Əməliyyatlar">
            {contextActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem key={action.href + action.label} value={action.label} onSelect={() => handleSelect(action.href)}>
                  <Icon className="mr-2 h-4 w-4 text-primary" />
                  <span>{action.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* 2. Server-side dinamik axtarış nəticələri (kontekst qrupu əvvəldə gəlir) */}
        {groups.map((group) => (
          <CommandGroup key={group.id} heading={group.label}>
            {group.items.map((item) => {
              const Icon = TYPE_ICON[item.type];
              return (
                <CommandItem
                  key={`${group.id}-${item.type}-${item.id}`}
                  value={`${group.id}-${item.id}`}
                  onSelect={() => handleSelect(item.href)}
                  className="items-start"
                >
                  <Icon className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        {groups.length > 0 && (filteredNavItems.length > 0 || filteredAdminItems.length > 0) && <CommandSeparator />}

        {/* 3. Qlobal naviqasiya */}
        {filteredNavItems.length > 0 && (
          <CommandGroup heading="Qlobal Naviqasiya">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.href} value={item.title} onSelect={() => handleSelect(item.href)}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {filteredAdminItems.length > 0 && (
          <CommandGroup heading="Administrasiya">
            {filteredAdminItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.href} value={item.title} onSelect={() => handleSelect(item.href)}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
