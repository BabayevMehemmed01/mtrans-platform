import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { CallOverlay } from "@/components/chat/CallOverlay";

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

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
        {/* Command Palette (Cmd+K) */}
        <CommandPalette />

        {/* Global Call Overlay — gələn/aktiv zəng UI-si */}
        <CallOverlay />

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
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
