import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// =============================================================================
// Next.js 16 Proxy (köhnə adı: Middleware)
// Route Protection — NextAuth v5
// =============================================================================

// Tamamilə açıq (public) route-lar — heç bir session yoxlaması aparılmır,
// nə giriş edən, nə də etməyən istifadəçi bu yollardan yönləndirilmir.
// Bu route-lar öz daxilində (token/secret key ilə) təhlükəsizliyi təmin edir.
const ALWAYS_PUBLIC_ROUTES = ["/api/crm/1c-sync", "/api/test-whatsapp", "/track"];

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Kənar API-lər və müştəri izləmə paneli — auth middleware-dən tamamilə azaddır
  const isAlwaysPublicRoute = ALWAYS_PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isAlwaysPublicRoute) {
    return NextResponse.next();
  }

  // Public route-lar — auth tələb olunmur
  const publicRoutes = ["/login", "/register", "/invite", "/api/invites/accept", "/api/invites/verify"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Auth yoxdursa və protected route-dursa → Login-ə yönləndir
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth varsa və public route-dursa → Ana səhifə konsepti yoxdur, birbaşa Mənim İşlərimə yönləndir
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard/my-work", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|api/crm/1c-sync|api/test-whatsapp|track|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
