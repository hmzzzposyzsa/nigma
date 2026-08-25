# NexusTop — Game Top-Up Platform

A modern, production-ready game top-up (digital goods) storefront built with **Next.js 16 (App Router)**, backed by **Supabase** (Postgres). It supports two purchase flows (direct payment & wallet deposit), an AI customer-service chatbot, a loyalty-tier system, flash sales, a credit/gamification system (prize roulette + exclusive events), public order-tracking, Telegram logging, configurable product delivery (auto-provider or manual), a news/berita page, and a dedicated site-settings table.

> The admin panel is **not** included here — it runs on separate hosting and writes to the **same** Supabase database. This repo is the customer-facing storefront + backend API.

---

## ✨ Features

- **Two purchase flows** — Direct (gateway) and Deposit-to-wallet, both with ID validation → payment → delivery → status tracking.
- **Product delivery method** — Each product can be set to `provider` (auto-deliver via ApiGames/SekaliPay) or `manual` (admin sends directly).
- **Telegram notifications** — Logs every order, deposit, delivery, failure, and registration to a Telegram chat.
- **Berita (News)** — Admin-published news articles, visible to everyone (guests included). Pinned articles, categories, detail pages.
- **Loyalty tiers** — Pemula / Langganan / Sultan with auto-computed discounts (2% / 3.5%) based on monthly spend.
- **Credit & gamification** — Earn Spin Credits per transaction (max 5/tx for all roles), spend on Prize Roulette + exclusive Hadiah events.
- **Flash sales** — Time-windowed discounts with stock limits and live countdowns.
- **Public order tracking** — `/cek-pesanan` lets anyone track an order by invoice number.
- **AI chatbot** — Indonesian-only customer service (OpenRouter / Llama 3.3 70B) with strict scope guardrails.
- **Dedicated `site_settings` table** — Every branding/SEO/contact setting is its own editable column (no JSON). Edit cells in the Table Editor → site updates instantly.
- **Dark / light mode**, fully responsive, real payment-method logos, real stock images.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (Postgres) — Drizzle ORM for writes, Supabase anon client for reads |
| Auth | JWT sessions (`jose`) + `bcryptjs`, Google OAuth shim |
| Payments | Midtrans (gateway + webhook + polling) |
| Products/Delivery | ApiGames / SekaliPay (auto-deliver) or manual |
| Notifications | Resend (email), Fonnte (WhatsApp), Telegram bot (admin logs) |
| AI | OpenRouter — Llama 3.3 70B (customer service only) |
| Styling | Tailwind CSS v4, Space Grotesk + Plus Jakarta Sans |

---

## 🚀 Quick Start (Local Development)

```bash
npm install
cp .env.example .env   # set DATABASE_URL + SESSION_SECRET
npx drizzle-kit push    # push schema to local DB
npx tsx src/scripts/seed.ts  # (optional) seed demo data
npm run dev
```

---

## 🗄️ Database Setup (Supabase)

In Supabase **SQL Editor**, run in order:

1. **`supabase/setup.sql`** — creates all tables, enums, FKs, indexes + RLS policies.
2. **`supabase/seed-data.sql`** — pre-loads site settings, games, products, banners, events, news, API-key placeholders.

Both are idempotent. If upgrading from an older version:
```sql
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
```

---

## 🎛️ Managing Your Site (No Code, No Redeploy)

### `site_settings` Table — Branding & SEO

One row (`id = 1`), each column is an individual setting. Edit cells in the Table Editor:

| Column | Controls |
|---|---|
| `name` | Website name (header, footer, `<title>`) |
| `tagline` | Subtitle next to logo |
| `description` | SEO meta description |
| `keywords` | SEO keywords (comma-separated) |
| `favicon_url` | Browser tab icon |
| `og_image_url` | Social share preview image |
| `logo_url` | Custom logo (null = built-in mark) |
| `support_email` / `whatsapp` / `phone` / `address` | Contact info |
| `social_instagram` ... `social_whatsapp` | Social media links (one column each) |
| `popup_enabled` | Show/hide first-visit popup |
| `popup_title` / `popup_subtitle` / `popup_cta_text` / `popup_cta_link` | Popup content |
| `theme_color` | Accent color |

### `settings` Table — API Keys & Gamification Config

| Key | Type | Description |
|---|---|---|
| `secret_openrouter_api_key` | string | AI chatbot (Llama 3.3 70B) |
| `secret_apigames_merchant_id` | string | ApiGames catalog + delivery |
| `secret_apigames_secret` | string | ApiGames signature |
| `secret_sekalipay_api_key` | string | SekaliPay catalog |
| `secret_midtrans_server_key` | string | Midtrans payment gateway |
| `secret_midtrans_snap_url` | string | Midtrans Snap endpoint (auto-default) |
| `secret_midtrans_status_url` | string | Midtrans status endpoint (auto-default) |
| `secret_resend_api_key` | string | Email (Resend) |
| `secret_resend_from` | string | Email sender address (auto-default) |
| `secret_fonnte_token` | string | WhatsApp (Fonnte) |
| `secret_telegram_bot_token` | string | Telegram bot for admin logs |
| `secret_telegram_chat_id` | string | Telegram chat/channel ID |
| `secret_admin_api_key` | string | Authenticates manual-delivery + news API |
| `credit_per_rupiah` | number | Spin credit rate (default 5000 = 1/Rp5k) |
| `roulette_prizes` | JSON | Prize wheel segments & probabilities |

### Other Tables

| Table | Purpose |
|---|---|
| `products` | Catalog — `cost_price` (sell auto-computed by tier), `delivery_method` (`provider`/`manual`), `sku` |
| `games` | Game categories with images, ID field labels |
| `news` | Berita articles (title, excerpt, content, image, category, pinned, published) |
| `banners` | Homepage carousel slides |
| `events` | Exclusive Hadiah events |
| `flash_sales` | Timed discounts + stock limits |
| `orders` / `deposits` | Transaction records |
| `users` | Accounts (role, balance, credits, spend) |

---

## 📦 Product Delivery Methods

| Value | Behavior |
|---|---|
| `provider` (default) | Auto-delivers via ApiGames/SekaliPay after payment |
| `manual` | Stays "processing" + Telegram alert. Admin sends item, then calls manual-deliver API |

```sql
-- Set in Table Editor or SQL:
UPDATE products SET delivery_method = 'manual' WHERE sku = 'FF-70';
```

Confirm manual delivery (from your admin panel):
```
POST /api/orders/{id}/manual-deliver
Header: x-admin-key: {secret_admin_api_key value}
```

---

## 📱 Telegram Notifications

Logs every event to a Telegram chat: new orders, deliveries, failures, manual-delivery alerts, deposits, registrations.

**Setup:**
1. Create a bot via [@BotFather](https://t.me/BotFather) → get token
2. Add bot to your chat/group → get chat ID
3. Set `secret_telegram_bot_token` + `secret_telegram_chat_id` in the `settings` table

---

## 📰 Berita (News)

Admin-published news, visible to everyone (guests + all roles):
- `/berita` — article listing (pinned featured cards + regular grid)
- `/berita/[id]` — full article detail page with social share

**Publish via API (from admin panel):**
```
POST /api/news
Header: x-admin-key: {secret_admin_api_key value}
Body: { "title": "...", "content": "...", "category": "Promo", "pinned": true }
```

Or insert a row directly in the `news` table via Table Editor.

---

## 🔐 Security Model

| | Credential | Where |
|---|---|---|
| **Frontend reads** | Supabase **anon key** | `NEXT_PUBLIC_SUPABASE_*` env (RLS-protected, read-only) |
| **Backend writes** | `DATABASE_URL` (Drizzle) | env, server-only (bypasses RLS) |
| **API keys** | `settings` table (`secret_*`) | Server-only, never in `.env` or browser |
| **Service role key** | env (your admin panel) | Never in this repo |

---

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://...supabase-pooler...        # REQUIRED
SESSION_SECRET=<openssl rand -base64 32>                # REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co    # frontend reads
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key                  # frontend reads (RLS)
NEXT_PUBLIC_SITE_URL=https://your-domain.com            # SEO metadata base
```

Integration keys go in the `settings` table, not `.env`.

---

## ☁️ Deployment (Cloudflare Pages)

1. Push to GitHub → connect repo in Cloudflare Pages
2. Build command: `npm run build`
3. Set the 5 env vars above in the dashboard
4. Deploy
5. Run `supabase/setup.sql` + `supabase/seed-data.sql` in Supabase
6. Edit `site_settings` table + paste API keys in `settings` table

---

## 🧮 Pricing & Tiers

```
sell_price = cost_price × (1 + tier_margin)
```
| Tier | Margin | Discount shown | Credits/tx |
|---|---|---|---|
| Pemula | 5% | Harga Normal | Max 5 |
| Langganan | 3% | Diskon 2% | Max 5 |
| Sultan | 1.5% | Diskon 3.5% | Max 5 |

Tiers evaluated monthly. `/hadiah` visible to **Langganan & Sultan only**.

---

## 🔌 API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/logout` | Authentication |
| POST | `/api/orders` | Create order (balance or gateway) |
| GET/POST | `/api/orders/[id]` · `/check` | View / advance order status |
| POST | `/api/orders/[id]/manual-deliver` | Admin confirms manual delivery |
| GET | `/api/orders/track?invoice=X` | Public order tracking |
| POST | `/api/deposits` · `/check` | Wallet deposit flow |
| POST | `/api/roulette/spin` | Prize roulette (server-side outcome) |
| POST | `/api/events/checkin` · `/mystery` | Exclusive event mechanics |
| GET | `/api/events/leaderboard` | Weekly spend leaderboard |
| GET/POST/PATCH/DELETE | `/api/news` | News CRUD (POST/PATCH/DELETE need x-admin-key) |
| POST | `/api/chatbot` | AI customer service (Indonesian) |
| POST | `/api/webhooks/midtrans` | Midtrans payment webhook |
| POST | `/api/validate-game-id` | Game ID validation |
| GET | `/api/config/secrets` | Masked status of API keys |

---

## ⚠️ Production Checklist

- [ ] Run `supabase/setup.sql` + `supabase/seed-data.sql`
- [ ] Set env vars: `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_SITE_URL`
- [ ] Edit `site_settings` table (name, tagline, SEO, contact, favicon, social)
- [ ] Paste API keys in `settings` table (`secret_*`)
- [ ] Set Telegram bot token + chat ID
- [ ] Set `secret_admin_api_key` for manual delivery + news API
- [ ] Set product `delivery_method` (provider or manual)
- [ ] Configure Midtrans webhook → `/api/webhooks/midtrans`

---

## 📁 Project Structure

```
src/
  app/            Pages + API routes
  components/     Header, Footer, PurchaseFlow, RouletteGame, Leaderboard, Chatbot, ...
  db/             Drizzle schema (18 tables)
  lib/            auth, tiers, ledger, payments, integrations, telegram, secrets, site, queries
supabase/         setup.sql (structure + RLS), seed-data.sql (content)
public/           favicon.svg, banners/, payment-icons/, robots.txt
```

---

## 📝 License

Proprietary — © NexusTop. All rights reserved.
