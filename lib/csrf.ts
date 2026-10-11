import { NextRequest, NextResponse } from "next/server";

/**
 * CSRF backstop for admin mutations: require a custom header that
 * cross-site forms cannot set without a CORS preflight (which same-origin
 * APIs reject). Pair with the SameSite=lax session cookie.
 */
export function csrfGuard(req: NextRequest): NextResponse | null {
  if (req.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
