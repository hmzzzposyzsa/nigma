import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
  date,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Shared data layer.
 *
 * In production this schema lives in Supabase (Postgres). The customer-facing
 * Cloudflare frontend reads public rows (games/products/banners/events) with the
 * anon key under RLS, while every sensitive/stateful action is dispatched to the
 * Vercel backend API routes that own the secret keys (Midtrans, ApiGames,
 * SekaliPay, Resend, Fonnte, OpenRouter). In this sandbox the same schema is run
 * against the local Postgres instance via Drizzle — the table/row shapes are
 * identical, so the data layer is swappable without touching app code.
 */

export const userRole = pgEnum("user_role", ["pemula", "langganan", "sultan"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "processing",
  "delivered",
  "failed",
  "cancelled",
]);
export const paymentStatus = pgEnum("payment_status", ["pending", "success", "failed"]);
export const depositStatus = pgEnum("deposit_status", ["pending", "success", "failed"]);
export const creditType = pgEnum("credit_type", [
  "earned_purchase",
  "welcome_bonus",
  "spent_roulette",
  "spent_event",
  "event_reward",
  "admin_adjust",
]);
export const walletType = pgEnum("wallet_type", [
  "deposit",
  "purchase",
  "cashback",
  "refund",
  "admin_adjust",
]);
export const eventType = pgEnum("event_type", [
  "mystery_box",
  "leaderboard",
  "community_goal",
  "quiz",
  "login_streak",
  "referral",
  "auction",
  "stamp_card",
]);
export const tierVisibility = pgEnum("tier_visibility", ["langganan", "sultan", "both"]);
export const discountType = pgEnum("discount_type", ["percentage", "fixed"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email"),
    phone: text("phone"),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    oauthProvider: text("oauth_provider"),
    oauthSubject: text("oauth_subject"),
    role: userRole("role").default("pemula").notNull(),
    lastMonthRole: userRole("last_month_role").default("pemula").notNull(),
    balance: integer("balance").default(0).notNull(),
    creditBalance: integer("credit_balance").default(0).notNull(),
    monthlySpend: integer("monthly_spend").default(0).notNull(),
    totalSpend: integer("total_spend").default(0).notNull(),
    streakDays: integer("streak_days").default(0).notNull(),
    lastCheckIn: date("last_check_in"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), uniqueIndex("users_phone_idx").on(t.phone)]
);

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  publisher: text("publisher"),
  imageUrl: text("image_url").notNull(),
  category: text("category").default("Game").notNull(),
  needsServerId: boolean("needs_server_id").default(false).notNull(),
  idFieldLabel: text("id_field_label").default("ID Game").notNull(),
  serverFieldLabel: text("server_field_label").default("Server").notNull(),
  idPlaceholder: text("id_placeholder").default("Masukkan ID Game"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("games_slug_idx").on(t.slug)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    sku: text("sku"),
    itemName: text("item_name").notNull(),
    denomination: text("denomination"),
    costPrice: integer("cost_price").notNull(),
    provider: text("provider").default("manual").notNull(),
    deliveryMethod: text("delivery_method").default("provider").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("products_game_idx").on(t.gameId)]
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceNo: text("invoice_no").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    gameUserId: text("game_user_id").notNull(),
    serverId: text("server_id"),
    contact: text("contact").notNull(),
    paymentMethod: text("payment_method").notNull(),
    paidWithBalance: boolean("paid_with_balance").default(false).notNull(),
    basePrice: integer("base_price").notNull(),
    marginPct: numeric("margin_pct", { precision: 6, scale: 3 }).notNull(),
    amount: integer("amount").notNull(),
    creditsEarned: integer("credits_earned").default(0).notNull(),
    status: orderStatus("status").default("pending").notNull(),
    paymentStatus: paymentStatus("payment_status").default("pending").notNull(),
    deliveryStatus: paymentStatus("delivery_status").default("pending").notNull(),
    providerTrxId: text("provider_trx_id"),
    snapshot: jsonb("snapshot"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("orders_invoice_idx").on(t.invoiceNo),
    index("orders_user_idx").on(t.userId),
  ]
);

export const deposits = pgTable("deposits", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNo: text("invoice_no").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: depositStatus("status").default("pending").notNull(),
  vaNumber: text("va_number"),
  vaBank: text("va_bank"),
  qrString: text("qr_string"),
  deeplinkUrl: text("deeplink_url"),
  providerTrxId: text("provider_trx_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: walletType("type").notNull(),
    delta: integer("delta").notNull(),
    description: text("description"),
    reference: text("reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("wallet_user_idx").on(t.userId)]
);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: creditType("type").notNull(),
    delta: integer("delta").notNull(),
    description: text("description"),
    reference: text("reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("credit_user_idx").on(t.userId)]
);

export const rouletteSpins = pgTable(
  "roulette_spins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    segment: integer("segment").notNull(),
    prizeType: text("prize_type").notNull(),
    prizeLabel: text("prize_label").notNull(),
    prizeValue: integer("prize_value").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("roulette_user_idx").on(t.userId)]
);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  bannerImage: text("banner_image"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  tierVisibility: tierVisibility("tier_visibility").default("both").notNull(),
  creditCost: integer("credit_cost").default(0).notNull(),
  eventType: eventType("event_type").notNull(),
  config: jsonb("config"),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const eventParticipations = pgTable(
  "event_participations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("event_part_event_idx").on(t.eventId), index("event_part_user_idx").on(t.userId)]
);

export const flashSales = pgTable(
  "flash_sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    discountType: discountType("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    stockLimit: integer("stock_limit"),
    soldCount: integer("sold_count").default(0).notNull(),
    status: text("status").default("scheduled").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("flash_product_idx").on(t.productId)]
);

export const vouchers = pgTable(
  "vouchers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountType: discountType("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    maxDiscount: integer("max_discount").default(0).notNull(),
    source: text("source"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isUsed: boolean("is_used").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("vouchers_user_idx").on(t.userId)]
);

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  ctaText: text("cta_text"),
  ctaLink: text("cta_link"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Dedicated site-settings table — one row (id=1), each column is an individual
 * setting. Much easier to edit in the Supabase Table Editor than JSON blobs.
 */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  name: text("name").default("NexusTop").notNull(),
  tagline: text("tagline").default("Top-Up Game Tercepat & Terpercaya").notNull(),
  description: text("description").default("").notNull(),
  keywords: text("keywords").default("").notNull(),
  faviconUrl: text("favicon_url").default("/favicon.svg").notNull(),
  ogImageUrl: text("og_image_url").default("/banners/flash-sale.jpg").notNull(),
  logoUrl: text("logo_url"),
  supportEmail: text("support_email").default("support@nexustop.id").notNull(),
  whatsapp: text("whatsapp").default("6281234567890").notNull(),
  phone: text("phone").default(""),
  address: text("address").default(""),
  currency: text("currency").default("IDR").notNull(),
  locale: text("locale").default("id-ID").notNull(),
  themeColor: text("theme_color").default("#0ea5e9").notNull(),
  socialInstagram: text("social_instagram").default("https://instagram.com"),
  socialTiktok: text("social_tiktok").default("https://tiktok.com"),
  socialTwitter: text("social_twitter").default("https://twitter.com"),
  socialFacebook: text("social_facebook").default("https://facebook.com"),
  socialYoutube: text("social_youtube").default("https://youtube.com"),
  socialDiscord: text("social_discord").default("https://discord.com"),
  socialWhatsapp: text("social_whatsapp").default("6281234567890"),
  popupEnabled: boolean("popup_enabled").default(true).notNull(),
  popupImageUrl: text("popup_image_url").default("/banners/flash-sale.jpg"),
  popupTitle: text("popup_title").default("Selamat Datang di NexusTop!"),
  popupSubtitle: text("popup_subtitle").default("Top up game favoritmu lebih cepat & dapat Spin Credit di setiap transaksi."),
  popupCtaText: text("popup_cta_text").default("Lihat Flash Sale"),
  popupCtaLink: text("popup_cta_link").default("/#flash-sale"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const news = pgTable("news", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  category: text("category").default("Info").notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type News = typeof news.$inferSelect;

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    kind: text("kind").default("info").notNull(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notif_user_idx").on(t.userId)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Game = typeof games.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Deposit = typeof deposits.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type FlashSale = typeof flashSales.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Voucher = typeof vouchers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
