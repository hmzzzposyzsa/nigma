-- ============================================================================
-- NexusTop — FULL DATABASE SETUP (run once in the Supabase SQL Editor)
--
-- This single script creates ALL tables, enums, foreign keys, indexes AND the
-- Row Level Security (RLS) policies. Just open Supabase → SQL Editor → New
-- query, paste this whole file, and click Run.
--
-- It is idempotent: safe to re-run (it drops & recreates everything first).
-- WARNING: re-running wipes existing data — only run when (re)setting up.
--
-- After running, the public ANON key can only READ the catalog tables; it can
-- never write or read private tables. Writes happen server-side via DATABASE_URL
-- (Drizzle), which bypasses RLS.
-- ============================================================================

-- ---------- 1. Clean slate (drop tables + enums, ignore if absent) ----------
DROP TABLE IF EXISTS "event_participations" CASCADE;
DROP TABLE IF EXISTS "flash_sales" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "credit_transactions" CASCADE;
DROP TABLE IF EXISTS "deposits" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "roulette_spins" CASCADE;
DROP TABLE IF EXISTS "vouchers" CASCADE;
DROP TABLE IF EXISTS "wallet_transactions" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "banners" CASCADE;
DROP TABLE IF EXISTS "games" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

DROP TYPE IF EXISTS "credit_type";
DROP TYPE IF EXISTS "deposit_status";
DROP TYPE IF EXISTS "discount_type";
DROP TYPE IF EXISTS "event_type";
DROP TYPE IF EXISTS "order_status";
DROP TYPE IF EXISTS "payment_status";
DROP TYPE IF EXISTS "tier_visibility";
DROP TYPE IF EXISTS "user_role";
DROP TYPE IF EXISTS "wallet_type";

-- ---------- 2. Enums --------------------------------------------------------
CREATE TYPE "public"."credit_type" AS ENUM('earned_purchase', 'welcome_bonus', 'spent_roulette', 'spent_event', 'event_reward', 'admin_adjust');
CREATE TYPE "public"."deposit_status" AS ENUM('pending', 'success', 'failed');
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');
CREATE TYPE "public"."event_type" AS ENUM('mystery_box', 'leaderboard', 'community_goal', 'quiz', 'login_streak', 'referral', 'auction', 'stamp_card');
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'processing', 'delivered', 'failed', 'cancelled');
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed');
CREATE TYPE "public"."tier_visibility" AS ENUM('langganan', 'sultan', 'both');
CREATE TYPE "public"."user_role" AS ENUM('pemula', 'langganan', 'sultan');
CREATE TYPE "public"."wallet_type" AS ENUM('deposit', 'purchase', 'cashback', 'refund', 'admin_adjust');

-- ---------- 3. Tables -------------------------------------------------------
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"title" text,
	"subtitle" text,
	"cta_text" text,
	"cta_link" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"phone" text,
	"name" text NOT NULL,
	"password_hash" text,
	"oauth_provider" text,
	"oauth_subject" text,
	"role" "user_role" DEFAULT 'pemula' NOT NULL,
	"last_month_role" "user_role" DEFAULT 'pemula' NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"credit_balance" integer DEFAULT 0 NOT NULL,
	"monthly_spend" integer DEFAULT 0 NOT NULL,
	"total_spend" integer DEFAULT 0 NOT NULL,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"last_check_in" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"publisher" text,
	"image_url" text NOT NULL,
	"category" text DEFAULT 'Game' NOT NULL,
	"needs_server_id" boolean DEFAULT false NOT NULL,
	"id_field_label" text DEFAULT 'ID Game' NOT NULL,
	"server_field_label" text DEFAULT 'Server' NOT NULL,
	"id_placeholder" text DEFAULT 'Masukkan ID Game',
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"sku" text,
	"item_name" text NOT NULL,
	"denomination" text,
	"cost_price" integer NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"delivery_method" text DEFAULT 'provider' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_no" text NOT NULL,
	"user_id" uuid,
	"game_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"game_user_id" text NOT NULL,
	"server_id" text,
	"contact" text NOT NULL,
	"payment_method" text NOT NULL,
	"paid_with_balance" boolean DEFAULT false NOT NULL,
	"base_price" integer NOT NULL,
	"margin_pct" numeric(6, 3) NOT NULL,
	"amount" integer NOT NULL,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"delivery_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"provider_trx_id" text,
	"snapshot" jsonb,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_no" text NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"payment_method" text NOT NULL,
	"status" "deposit_status" DEFAULT 'pending' NOT NULL,
	"va_number" text,
	"va_bank" text,
	"qr_string" text,
	"deeplink_url" text,
	"provider_trx_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "wallet_type" NOT NULL,
	"delta" integer NOT NULL,
	"description" text,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "credit_type" NOT NULL,
	"delta" integer NOT NULL,
	"description" text,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "roulette_spins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"segment" integer NOT NULL,
	"prize_type" text NOT NULL,
	"prize_label" text NOT NULL,
	"prize_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"banner_image" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"tier_visibility" "tier_visibility" DEFAULT 'both' NOT NULL,
	"credit_cost" integer DEFAULT 0 NOT NULL,
	"event_type" "event_type" NOT NULL,
	"config" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "event_participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "flash_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"stock_limit" integer,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"code" text NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"max_discount" integer DEFAULT 0 NOT NULL,
	"source" text,
	"expires_at" timestamp with time zone,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"name" text DEFAULT 'NexusTop' NOT NULL,
	"tagline" text DEFAULT 'Top-Up Game Tercepat & Terpercaya' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"keywords" text DEFAULT '' NOT NULL,
	"favicon_url" text DEFAULT '/favicon.svg' NOT NULL,
	"og_image_url" text DEFAULT '/banners/flash-sale.jpg' NOT NULL,
	"logo_url" text,
	"support_email" text DEFAULT 'support@nexustop.id' NOT NULL,
	"whatsapp" text DEFAULT '6281234567890' NOT NULL,
	"phone" text DEFAULT '',
	"address" text DEFAULT '',
	"currency" text DEFAULT 'IDR' NOT NULL,
	"locale" text DEFAULT 'id-ID' NOT NULL,
	"theme_color" text DEFAULT '#0ea5e9' NOT NULL,
	"social_instagram" text DEFAULT 'https://instagram.com',
	"social_tiktok" text DEFAULT 'https://tiktok.com',
	"social_twitter" text DEFAULT 'https://twitter.com',
	"social_facebook" text DEFAULT 'https://facebook.com',
	"social_youtube" text DEFAULT 'https://youtube.com',
	"social_discord" text DEFAULT 'https://discord.com',
	"social_whatsapp" text DEFAULT '6281234567890',
	"popup_enabled" boolean DEFAULT true NOT NULL,
	"popup_image_url" text DEFAULT '/banners/flash-sale.jpg',
	"popup_title" text DEFAULT 'Selamat Datang di NexusTop!',
	"popup_subtitle" text DEFAULT 'Top up game favoritmu lebih cepat & dapat Spin Credit di setiap transaksi.',
	"popup_cta_text" text DEFAULT 'Lihat Flash Sale',
	"popup_cta_link" text DEFAULT '/#flash-sale',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"image_url" text,
	"category" text DEFAULT 'Info' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"kind" text DEFAULT 'info' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ---------- 4. Foreign keys -------------------------------------------------
ALTER TABLE "products" ADD CONSTRAINT "products_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "roulette_spins" ADD CONSTRAINT "roulette_spins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;

-- ---------- 5. Indexes ------------------------------------------------------
CREATE UNIQUE INDEX "games_slug_idx" ON "games" USING btree ("slug");
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");
CREATE UNIQUE INDEX "orders_invoice_idx" ON "orders" USING btree ("invoice_no");
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");
CREATE INDEX "products_game_idx" ON "products" USING btree ("game_id");
CREATE INDEX "flash_product_idx" ON "flash_sales" USING btree ("product_id");
CREATE INDEX "wallet_user_idx" ON "wallet_transactions" USING btree ("user_id");
CREATE INDEX "credit_user_idx" ON "credit_transactions" USING btree ("user_id");
CREATE INDEX "roulette_user_idx" ON "roulette_spins" USING btree ("user_id");
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id");
CREATE INDEX "vouchers_user_idx" ON "vouchers" USING btree ("user_id");
CREATE INDEX "event_part_event_idx" ON "event_participations" USING btree ("event_id");
CREATE INDEX "event_part_user_idx" ON "event_participations" USING btree ("user_id");

-- ============================================================================
-- 6. Row Level Security — makes the public ANON key safe in the frontend
--    anon can ONLY read catalog tables; it can never write or read private data.
-- ============================================================================
ALTER TABLE "games"        ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read games"        ON "games";
CREATE POLICY "public read games"        ON "games"        FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE "products"     ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read products"     ON "products";
CREATE POLICY "public read products"     ON "products"     FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE "banners"      ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read banners"      ON "banners";
CREATE POLICY "public read banners"      ON "banners"      FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE "flash_sales"  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read flash_sales"  ON "flash_sales";
CREATE POLICY "public read flash_sales"  ON "flash_sales"  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE "events"       ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read events"       ON "events";
CREATE POLICY "public read events"       ON "events"       FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE "news"              ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read news"        ON "news";
CREATE POLICY "public read news"        ON "news"        FOR SELECT TO anon, authenticated USING (true);

-- site_settings: RLS enabled, NO public policy → only readable server-side
-- via DATABASE_URL (Drizzle). The frontend never queries this table directly.
ALTER TABLE "site_settings"     ENABLE ROW LEVEL SECURITY;

-- Private tables: RLS enabled, NO anon policy → anon cannot read or write them.
ALTER TABLE "users"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deposits"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wallet_transactions"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credit_transactions"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roulette_spins"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_participations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vouchers"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications"        ENABLE ROW LEVEL SECURITY;

-- Done. No INSERT/UPDATE/DELETE policies exist for anon, so by default the anon
-- key is read-only everywhere. Writes happen via DATABASE_URL (Drizzle / postgres
-- role), which bypasses RLS.
