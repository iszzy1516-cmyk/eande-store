/**
 * Client-side API access. All fetches go to the API origin (Railway) with
 * credentials, so auth cookies stay first-party to the API even when the
 * frontend is hosted elsewhere (Cloudflare Pages).
 */
export const API_BASE: string = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: init?.headers,
  });
  if (res.status === 401 && typeof window !== "undefined") {
    const onAdmin = window.location.pathname.startsWith("/admin");
    if (onAdmin && window.location.pathname !== "/admin/login") {
      window.location.href = "/admin/login";
    }
  }
  return res;
}
