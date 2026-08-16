import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { CallOverlay } from "@/components/chat/CallOverlay";
import { prisma } from "@/lib/prisma";

// YENİ: Arxa plan (Wallpaper) üçün köməkçi funksiya
function getWallpaperClass(wp: string | null | undefined) {
  switch (wp) {
    case 'gradient-1': return 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950';
    case 'mesh': return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-black';
    case 'abstract': return 'bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900'; 
    default: return 'bg-[hsl(var(--background))]';
  }
}

// =============================================================================
// Dashboard Layout — Server Component
// Auth yoxlaması server-tərəfdə aparılır
// =============================================================================

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Server-side auth guard
  if (!session) {
    redirect("/login");
  }

  // YENİ: İstifadəçinin bazadakı ayarlarını (wallpaper) çəkirik
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { wallpaper: true } as any
  });

  const wallpaperClass = getWallpaperClass((dbUser as any)?.wallpaper);

  return (
    <SessionProvider session={session}>
      {/* YENİ: wallpaperClass-ı ana div-ə əlavə etdik */}
      <div className={`flex h-screen overflow-hidden ${wallpaperClass}`}>
        {/* Command Palette (Cmd+K) */}
        <CommandPalette />

        {/* Global Call Overlay — gələn/aktiv zəng UI-si */}
        <CallOverlay />

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        {/* YENİ: bg-white/60 qatını atırıq ki, arxadakı rəng çox azacıq şəffaf görünsün (Glassmorphism) */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white/60 dark:bg-black/20 backdrop-blur-[2px]">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}