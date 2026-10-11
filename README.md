# E&E Kiddies Wears 🍼✨

Full-stack e-commerce website for **E&E Kiddies Wears** — baby & kids clothes, shoes, onesies and towels. Gold/yellow theme, Bachs payments (NGN), and a full admin panel.

## Features

- 🛍️ **Storefront** — homepage with categories & featured products, shop with category filters and search, product pages with size selection, cart (saved in the browser), checkout
- 💳 **Bachs payments** — hosted checkout with server-side verification and signed webhooks, prices always recomputed from the database (NGN)
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

## Admin account

The admin email is `admin@eandekiddies.com`. There is **no default password in the codebase** — set one before seeding:

```bash
ADMIN_INITIAL_PASSWORD="your-strong-password" npx prisma db seed
```

In development, if you skip it, a random password is generated and printed. After first login, change it anytime from **Admin → Settings** (which also revokes all other sessions).

## Bachs setup (required for real payments)

1. Create a [Bachs](https://bachs.io) account and open the dashboard (sandbox first — no heavy KYC needed to test).
2. Copy your API key into `.env` as `BACHS_SECRET_KEY` (`sk_sandbox_...` for testing, `sk_live_...` when going live — the code picks the right API host from the key prefix).
3. Restart the dev server. Without a key, checkout shows a friendly "payment not configured" notice instead of failing.
4. (Optional) Webhooks: in the Bachs Developer Portal → Webhooks, add `https://your-domain/api/payment/webhook`, subscribe to `collection.succeeded`, and put the endpoint's signing secret in `.env` as `BACHS_WEBHOOK_SECRET`. Signature verification is built in.

Note: Bachs requires `success_url` to be a public http(s) address — `localhost` is refused even in sandbox. For local payment testing, use a tunnel (e.g. the Bachs CLI's event forwarding, or any HTTPS tunnel) or test on the deployed site.

## The logo

The client's logo is at `public/logo.jpeg`; `public/logo-mark.png` is a cropped onesie mark used in the navbar. To replace them, just overwrite those files.

## Project structure

```
app/
  (store)/        storefront pages (home, shop, product, cart, checkout)
  admin/          admin login + dashboard (orders, products)
  api/            products, checkout, payment (bachs), auth, admin routes
components/       navbar, footer, product card, admin sidebar, ...
lib/              db (prisma), auth, jwt, bachs, cart, orders, telegram, format
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
