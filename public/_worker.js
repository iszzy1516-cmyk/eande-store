// Cloudflare Pages advanced-mode worker: serve the static site, proxy /api/*
// to the Render backend same-origin, and fall back to the product page shell
// for any /product/<slug> URL (product data loads client-side from the API).
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

    let asset = await env.ASSETS.fetch(request);

    // Product detail pages are rendered client-side; serve the shell for
    // any /product/<slug> that wasn't pre-built.
    if (
      asset.status === 404 &&
      /^\/product\/[^/]+\/?$/.test(url.pathname)
    ) {
      const fallback = new URL(url);
      fallback.pathname = "/product/placeholder/";
      asset = await env.ASSETS.fetch(new Request(fallback, request));
    }

    return asset;
  },
};
