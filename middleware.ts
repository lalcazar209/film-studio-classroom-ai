import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

const ROLE_PREFIXES: Record<string, Role> = {
  "/student": "STUDENT",
  "/teacher": "TEACHER",
  "/admin": "ADMIN",
  "/parent": "PARENT",
  "/mentor": "MENTOR",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const requiredRole = Object.entries(ROLE_PREFIXES).find(([prefix]) =>
    pathname.startsWith(prefix),
  )?.[1];

  if (!requiredRole) return NextResponse.next();

  const session = req.auth;
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!session.user.isActive) {
    return NextResponse.redirect(new URL("/account-disabled", req.url));
  }

  // ADMIN can access every portal for support/oversight; other roles are scoped to their own.
  if (session.user.role !== requiredRole && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*", "/parent/:path*", "/mentor/:path*"],
};
