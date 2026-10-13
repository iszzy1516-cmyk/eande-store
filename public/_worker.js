// Cloudflare Pages advanced-mode worker: serve the static site, proxy /api/*
// to the Render backend same-origin, fall back to the product page shell for
// any /product/<slug> URL, and neutralize immutable caching on JS/CSS chunks
// (direct-upload Pages deploys don't purge the edge cache by themselves).
const STATIC_CACHE = "public, max-age=300, must-revalidate";

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
      return fetch(
        new Request(target, {
          method: request.method,
          headers,
          body: ["GET", "HEAD"].includes(request.method)
            ? undefined
            : request.body,
          redirect: "manual",
        })
      );
    }

    let response = await env.ASSETS.fetch(request);

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

    // Direct-upload deployments reuse the same chunk URLs with new content;
    // edge-cached "immutable" bytes would otherwise stick for a year.
    if (url.pathname.startsWith("/_next/static/") && response.ok) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", STATIC_CACHE);
      return new Response(response.body, { status: response.status, headers });
    }

    return response;
  },
};
