import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Always allow the login page through
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const hasSession = request.cookies.has("hf_admin_session");
    if (!hasSession) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
