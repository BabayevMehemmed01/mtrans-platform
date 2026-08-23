import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hasModuleAccessFromKeys,
  isMutationMethod,
  MODULE_ROUTE_PREFIXES,
} from "@/lib/module-access";

const ALWAYS_PUBLIC_ROUTES = [
  "/api/crm/1c-sync",
  "/api/test-whatsapp",
  "/track",
  "/api/setup-demo",
];

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAlwaysPublicRoute = ALWAYS_PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isAlwaysPublicRoute) {
    return NextResponse.next();
  }

  const publicRoutes = ["/login", "/register", "/invite", "/api/invites/accept", "/api/invites/verify"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard/my-work", req.url));
  }

  const moduleMatch = MODULE_ROUTE_PREFIXES.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );
  if (session && moduleMatch) {
    const permissions = (session.user?.role?.permissions as string[] | undefined) ?? [];
    const flags = {
      isFounder: Boolean(session.user?.isFounder),
      isSuperAdmin: Boolean(session.user?.isSuperAdmin),
    };
    const action = isMutationMethod(req.method) ? "manage" : "view";
    if (!hasModuleAccessFromKeys(permissions, moduleMatch.module, action, flags)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Access Denied" },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|api/crm/1c-sync|api/test-whatsapp|track|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
