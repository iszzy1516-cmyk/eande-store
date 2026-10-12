// Cloudflare Pages advanced-mode worker: serve the static site, and proxy
// /api/* to the Render backend so the browser only ever talks to
// eekiddies.com (no CORS, no cross-site cookies).
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
      headers.delete("cf-connecting-ip"); // let Render see its own client IP
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

    return env.ASSETS.fetch(request);
  },
};
