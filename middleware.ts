import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/jwt";

const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  return origin && FRONTEND_ORIGINS.includes(origin) ? origin : null;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CORS for API routes when the frontend is hosted on another origin
  // (Cloudflare Pages <-> Railway). Preflights never carry cookies.
  const allowedOrigin = corsOrigin(req);
  if (allowedOrigin && pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }
    const res =
      pathname.startsWith("/api/admin/") || pathname.startsWith("/admin")
        ? await guard(req, pathname)
        : NextResponse.next();
    if (res.status !== 307) {
      res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
    }
    return res;
  }

  if (pathname.startsWith("/api/admin/") || pathname.startsWith("/admin")) {
    return guard(req, pathname);
  }

  return NextResponse.next();
}

async function guard(req: NextRequest, pathname: string) {
  // The login page is public.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on admin pages, all API routes (CORS), and top-level paths.
  matcher: ["/admin/:path*", "/api/:path*"],
};
