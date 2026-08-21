import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorThemeProvider } from "@/components/providers/ColorThemeProvider";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ✅ Next.js-ə statik yığmanı dayandırmasını deyən sehrli sətir:
export const dynamic = 'force-dynamic';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WorkSpace ERP",
    template: "%s | WorkSpace ERP",
  },
  description:
    "Böyük komandalar üçün güclü, iyerarxik strukturlu iş idarəetmə platforması",
  keywords: ["ERP", "project management", "workspace", "team collaboration"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Gecikmə/pozulma (flicker) problemini aradan qaldırmaq üçün istifadəçinin
  // bazada saxlanılan mövzu (theme) və rəng teması (wallpaper/colorTheme)
  // seçimini server tərəfdə əvvəlcədən oxuyuruq. Beləliklə səhifə ilk dəfə
  // render olunanda düzgün mövzu ilə açılır, sonra "yanıb-sönmə" olmur.
  let initialTheme = "system";
  let initialColorTheme = "default";
  try {
    const session = await auth();
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { theme: true, wallpaper: true },
      });
      if (dbUser?.theme) initialTheme = dbUser.theme;
      if (dbUser?.wallpaper) initialColorTheme = dbUser.wallpaper;
    }
  } catch {
    // Sessiya/DB əlçatan deyilsə susmaya (default) dəyərlərlə davam et
  }

  return (
    <html
      lang="az"
      suppressHydrationWarning
      data-color-theme={initialColorTheme}
      className={cn("font-sans", geist.variable)}
    >
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* YENİ: Bütün saytı ThemeProvider içinə alırıq */}
        <ThemeProvider
          attribute="class"
          defaultTheme={initialTheme}
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider initialColorTheme={initialColorTheme}>
            {children}
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}