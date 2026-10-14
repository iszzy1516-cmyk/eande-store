// Cloudflare Pages advanced-mode worker: serve the static site, proxy /api/*
// to the Render backend same-origin, fall back to the product page shell for
// any /product/<slug> URL, add security headers to every response, and
// cache-bust static chunks (direct-upload Pages deploys don't purge the edge
// cache by themselves). Bump CACHE_BUST on every deploy that changes JS/CSS.
const CACHE_BUST = "4";

const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://*.r2.dev; " +
    "connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const target = new URL(
        "https://eande-api.onrender.com" + url.pathname + url.search
      );
      const headers = new Headers(request.headers);
      headers.set("host", "eande-api.onrender.com");
      headers.set("x-forwarded-host", url.host);
      const proxied = await fetch(
        new Request(target, {
          method: request.method,
          headers,
          body: ["GET", "HEAD"].includes(request.method)
            ? undefined
            : request.body,
          redirect: "manual",
        })
      );
      return withSecurityHeaders(proxied);
    }

    let response;

    if (url.pathname.startsWith("/_next/static/")) {
      // Same chunk URLs are reused across deploys; query-bust the edge cache
      // so browsers always get the current deployment's bytes.
      const busted = new URL(request.url);
      busted.searchParams.set("v", CACHE_BUST);
      response = await env.ASSETS.fetch(new Request(busted, request));
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "public, max-age=300, must-revalidate");
      return withSecurityHeaders(
        new Response(response.body, { status: response.status, headers })
      );
    }

    response = await env.ASSETS.fetch(request);

    // Product detail pages are rendered client-side; serve the shell for
    // any /product/<slug> that wasn't pre-built.
    if (
      response.status === 404 &&
      /^\/product\/[^/]+\/?$/.test(url.pathname)
    ) {
      const fallback = new URL(url);
      fallback.pathname = "/product/placeholder/";
      response = await env.ASSETS.fetch(new Request(fallback, request));
    }

    return withSecurityHeaders(response);
  },
};
