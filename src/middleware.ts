import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SESSION_OPTIONS, SessionData } from "./lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Halaman publik — bebas diakses
  if (pathname === "/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);

  // Belum login → redirect ke login
  if (!session.role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Panitia coba akses halaman admin → tolak
  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};