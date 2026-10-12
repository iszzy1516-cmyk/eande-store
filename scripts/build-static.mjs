/**
 * Build the Cloudflare Pages bundle (static export without the API).
 * Temporarily moves app/api aside so `output: export` doesn't try to
 * prerender cookie-using route handlers, then restores it — even on failure.
 */
import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const DISABLED = ".api-disabled-api";

process.env.STATIC_EXPORT = "true";
// NEXT_PUBLIC_API_URL intentionally unset: the Pages worker proxies /api/*
// same-origin, so the browser never needs an external API origin.

try {
  if (existsSync("app/api")) renameSync("app/api", DISABLED);
  const result = spawnSync("next", ["build"], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  if (existsSync(DISABLED)) renameSync(DISABLED, "app/api");
}
