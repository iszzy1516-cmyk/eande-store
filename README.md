# E&E Kiddies Wears 🍼✨

Full-stack e-commerce website for **E&E Kiddies Wears** — baby & kids clothes, shoes, onesies and towels. Gold/yellow theme, Paystack payments (NGN), and a full admin panel.

## Features

- 🛍️ **Storefront** — homepage with categories & featured products, shop with category filters and search, product pages with size selection, cart (saved in the browser), checkout
- 💳 **Paystack payments** — server-side transaction initialize + verify, prices always recomputed from the database (NGN, kobo)
- 🔐 **Admin panel** (`/admin/login`) — real authentication (bcrypt + JWT httpOnly cookie), dashboard with stats, orders management with status updates, product CRUD
- 🗄️ **SQLite + Prisma** — zero-config database, no external services needed for development

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite · jose · bcryptjs · zod

## Setup

```bash
npm install
npx prisma migrate dev   # create the database
npx prisma db seed       # demo admin + 12 sample products
npm run dev              # http://localhost:3000
```

## Demo admin credentials

| Email                   | Password   |
| ----------------------- | ---------- |
| `admin@eandekiddies.com` | `admin123` |

**Change these before going live.** To change them, update `prisma/seed.ts` and re-run `npx prisma db seed`, or hash a new password with bcrypt and update the `AdminUser` row.

## Paystack setup (required for real payments)

1. Create a Paystack account → [dashboard.paystack.com](https://dashboard.paystack.com) → Settings → API Keys & Webhooks
2. Copy `.env.example` values into `.env` and fill in:
   - `PAYSTACK_SECRET_KEY` — your secret key (starts with `sk_test_` / `sk_live_`)
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — your public key
3. Restart the dev server. Without keys, checkout shows a friendly "payment not configured" notice instead of failing.
4. (Optional) Webhook: point Paystack webhooks to `https://your-domain/api/paystack/webhook` — signature verification is built in.

## The logo

The client's logo is at `public/logo.jpeg`; `public/logo-mark.png` is a cropped onesie mark used in the navbar. To replace them, just overwrite those files.

## Project structure

```
app/
  (store)/        storefront pages (home, shop, product, cart, checkout)
  admin/          admin login + dashboard (orders, products)
  api/            products, checkout, paystack, auth, admin routes
components/       navbar, footer, product card, admin sidebar, ...
lib/              db (prisma), auth, jwt, paystack, cart, orders, format
prisma/           schema + seed
public/products/  product photos (client's own)
scripts/          telegram-bot.ts (conversational uploader)
```

## Telegram bots

Two separate bots, so staff never mix them up:

- **Alerts bot** (@eande_alerts_bot) — send-only. Every time an order is paid, it messages the admin chat with the customer name, phone, delivery address, total, and a photo of each ordered item. No commands, nothing to run — the website sends these itself. Token goes in `.env` as `TELEGRAM_ALERTS_BOT_TOKEN`.
- **Upload bot** — conversational product uploads from a phone: `/add` → name → category → price → sizes → stock → description → photo → publish. The product goes live instantly. Token goes in `.env` as `TELEGRAM_UPLOAD_BOT_TOKEN`, then run:

```bash
npm run bot
```

Setup:

1. In Telegram, send `/start` to each bot once.
2. Put the admin chat ID in `.env` as `TELEGRAM_ADMIN_CHAT_ID` (send `/start` to the upload bot while `TELEGRAM_ADMIN_CHAT_ID` is empty and it replies with your chat ID).

Only the configured chat ID can upload products. The upload bot uses long polling — no public URL needed.

## Deployment

Deploy to [Vercel](https://vercel.com): import this repo, set the env vars from `.env.example`, and run migrations against your production database. For production, consider switching Prisma from SQLite to PostgreSQL.
