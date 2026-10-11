import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // STATIC_EXPORT=true produces out/ for Cloudflare Pages; otherwise serve
  // the full app (Railway) including the API routes.
  output: isStaticExport ? "export" : undefined,
  images: isStaticExport ? { unoptimized: true } : undefined,
  trailingSlash: isStaticExport ? true : undefined,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
