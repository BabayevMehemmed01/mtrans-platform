import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { CallOverlay } from "@/components/chat/CallOverlay";
import { prisma } from "@/lib/prisma";

// YENİ: Arxa plan (Wallpaper) üçün şəkilləri qaytaran funksiya
function getWallpaperStyle(wp?: string | null) {
  const imageUrls: Record<string, string> = {
    'gradient-1': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop',
    'mesh': 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',       
    'abstract': 'https://images.unsplash.com/photo-1604080809712-4cb1b53e7f09?q=80&w=2000&auto=format&fit=crop',   
    'tech': 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop'         
  };

  if (wp && imageUrls[wp]) {
    return {
      backgroundImage: `url('${imageUrls[wp]}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    };
  }
  return {}; 
}

// =============================================================================
// Dashboard Layout — Server Component
// =============================================================================

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Server-side auth guard
  if (!session?.user?.id) {
    redirect("/login");
  }

  // BURADA as any İSTİFADƏ EDİRİK Kİ, XƏTALAR İTSİN
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { wallpaper: true } as any,
  });

  const userWallpaper = (dbUser as any)?.wallpaper;
  const wallpaperStyle = getWallpaperStyle(userWallpaper);
  const isDefault = !userWallpaper || userWallpaper === 'default';

  return (
    <SessionProvider session={session}>
      <div 
        className={`flex h-screen overflow-hidden ${isDefault ? 'bg-[hsl(var(--background))]' : ''}`}
        style={wallpaperStyle}
      >
        <CommandPalette />
        <CallOverlay />
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white/80 dark:bg-black/70 backdrop-blur-md">
          <Header />
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