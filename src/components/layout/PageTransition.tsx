"use client";

import { usePathname } from "next/navigation";

// =============================================================================
// Səhifələrarası keçid animasiyası — hər route dəyişdikdə (pathname key ilə)
// içərik yenidən mount olunur və `page-transition` (globals.css) animasiyası
// təkrar işə düşür, bununla naviqasiya daha "canlı" hiss olunur.
// =============================================================================
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition h-full">
      {children}
    </div>
  );
}
