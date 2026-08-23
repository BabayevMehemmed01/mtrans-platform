import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { PageTransition } from "@/components/layout/PageTransition";
import { CallOverlay } from "@/components/chat/CallOverlay";
import { FloatingChatbot } from "@/components/ai/FloatingChatbot";

// =============================================================================
// Dashboard Layout — Server Component
// Qeyd: Rəng teması (əvvəllər "wallpaper") artıq kök layout-da (layout.tsx)
// ColorThemeProvider vasitəsilə bütün tətbiqə tətbiq olunur, buna görə burada
// təkrar sorğu göndərmirik.
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

  return (
    <SessionProvider session={session}>
      <QueryProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <CommandPalette />
          <CallOverlay />
          <FloatingChatbot />
          <Sidebar />

          <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
            <Header />
            <main className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
          </div>
        </div>
      </QueryProvider>
    </SessionProvider>
  );
}