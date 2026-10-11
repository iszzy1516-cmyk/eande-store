import { z } from "zod";

/**
 * Central env validation — fails fast at boot on malformed values instead
 * of silently misbehaving at runtime (missing alerts, 503s at checkout).
 */
/** Empty strings in .env (KEY="") count as unset. */
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const schema = z.object({
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SESSION_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional()
  ),
  BACHS_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  BACHS_WEBHOOK_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),
  TELEGRAM_ALERTS_BOT_TOKEN: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),
  TELEGRAM_UPLOAD_BOT_TOKEN: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),
  TELEGRAM_ADMIN_CHAT_ID: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),
  ADMIN_INITIAL_PASSWORD: z.preprocess(
    emptyToUndefined,
    z.string().min(8).optional()
  ),
  NEXT_PUBLIC_API_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional()
  ),
  FRONTEND_ORIGIN: z.preprocess(
    emptyToUndefined,
    z.string().url().optional()
  ),
  R2_ACCOUNT_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  R2_ACCESS_KEY_ID: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),
  R2_SECRET_ACCESS_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),
  R2_BUCKET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  R2_PUBLIC_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional()
  ),
});

export const env = schema.parse(process.env);

/**
 * Public base URL of the site. Prefer NEXT_PUBLIC_APP_URL; only fall back
 * to the request origin when it is not set (local development).
 */
export function appUrl(origin?: string | null): string {
  return env.NEXT_PUBLIC_APP_URL ?? origin ?? "http://localhost:3000";
}
