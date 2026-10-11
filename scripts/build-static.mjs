/**
 * Build the Cloudflare Pages bundle (static export without the API).
 * Temporarily moves app/api aside so `output: export` doesn't try to
 * prerender cookie-using route handlers, then restores it — even on failure.
 */
import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const DISABLED = ".api-disabled-api";

process.env.STATIC_EXPORT = "true";
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error("Set NEXT_PUBLIC_API_URL to your API origin before building.");
  process.exit(1);
}

try {
  if (existsSync("app/api")) renameSync("app/api", DISABLED);
  const result = spawnSync("next", ["build"], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  if (existsSync(DISABLED)) renameSync(DISABLED, "app/api");
}
