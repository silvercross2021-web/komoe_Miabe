import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (anciennement Middleware) — protection des routes KOMOE.
 * Vérifie la présence du token JWT en cookie (komoe_access).
 *
 * Routes publiques : /login, /register, /public/*
 * Routes protégées : /commune/*, /controle/*, /finance/*, /bailleur/*
 */

const PUBLIC_PATHS = ["/login", "/register", "/public"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const accessToken =
    request.cookies.get("komoe_access")?.value ??
    request.headers.get("x-komoe-token");

  const isProtected = !isPublic(pathname) && pathname !== "/";

  if (isProtected && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
