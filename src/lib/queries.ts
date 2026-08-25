import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { games, products, banners, flashSales, rouletteSpins, events, users, news, orders } from "@/db/schema";
import { sellPrice } from "./tiers";
import { formatRupiah } from "./format";
import { supabaseBrowser as supabase, USE_SUPABASE } from "./supabase-browser";

/* ============================================================
 * Banner carousel
 * ========================================================== */
export async function getBanners() {
  if (USE_SUPABASE && supabase) {
    const { data } = await supabase
      .from("banners")
      .select("id,image_url,title,subtitle,cta_text,cta_link")
      .eq("is_active", true)
      .order("sort_order");
    return (data ?? []).map((r: any) => ({
      id: r.id,
      imageUrl: r.image_url,
      title: r.title,
      subtitle: r.subtitle,
      ctaText: r.cta_text,
      ctaLink: r.cta_link,
    }));
  }
  return db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.sortOrder));
}

/* ============================================================
 * Games catalog
 * ========================================================== */
export async function getActiveGames() {
  if (USE_SUPABASE && supabase) {
    const { data } = await supabase
      .from("games")
      .select("id,name,slug,image_url,category")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");
    return (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      imageUrl: r.image_url,
      category: r.category,
    }));
  }
  return db.select().from(games).where(eq(games.isActive, true)).orderBy(asc(games.sortOrder), asc(games.name));
}

export async function getGameBySlug(slug: string) {
  if (USE_SUPABASE && supabase) {
    const { data } = await supabase.from("games").select("*").eq("slug", slug).limit(1).single();
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      publisher: data.publisher,
      imageUrl: data.image_url,
      category: data.category,
      needsServerId: data.needs_server_id,
      idFieldLabel: data.id_field_label,
      serverFieldLabel: data.server_field_label,
      idPlaceholder: data.id_placeholder,
      description: data.description,
      isActive: data.is_active,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
    };
  }
  const rows = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getProductsForGame(gameId: string, role: string) {
  const rows =
    USE_SUPABASE && supabase
      ? ((await supabase
          .from("products")
          .select("id,sku,item_name,denomination,cost_price,provider")
          .eq("game_id", gameId)
          .eq("is_active", true)
          .order("sort_order")
          .order("cost_price")).data ?? [])
      : await db
          .select()
          .from(products)
          .where(and(eq(products.gameId, gameId), eq(products.isActive, true)))
          .orderBy(asc(products.sortOrder), asc(products.costPrice));

  return (rows as any[]).map((p) => ({
    id: p.id,
    sku: p.sku ?? null,
    itemName: p.item_name ?? p.itemName,
    denomination: p.denomination ?? null,
    costPrice: p.cost_price ?? p.costPrice,
    provider: p.provider,
    isActive: true,
    gameId,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    sellPrice: sellPrice(p.cost_price ?? p.costPrice, role),
  }));
}

/** Games that actually have at least one active product + their lowest price. */
export async function getFeaturedGames(role: string) {
  if (USE_SUPABASE && supabase) {
    const { data } = await supabase
      .from("games")
      .select("id,name,slug,image_url,category")
      .eq("is_active", true)
      .order("sort_order");
    const out: { id: string; name: string; slug: string; imageUrl: string; category: string; minPrice: number }[] = [];
    for (const g of data ?? []) {
      const { data: cheapest } = await supabase
        .from("products")
        .select("cost_price")
        .eq("game_id", g.id)
        .eq("is_active", true)
        .order("cost_price")
        .limit(1);
      if (!cheapest?.length) continue;
      out.push({
        id: g.id,
        name: g.name,
        slug: g.slug,
        imageUrl: g.image_url,
        category: g.category,
        minPrice: sellPrice(cheapest[0].cost_price, role),
      });
    }
    return out;
  }

  const rows = await db
    .select({
      id: games.id,
      name: games.name,
      slug: games.slug,
      imageUrl: games.imageUrl,
      category: games.category,
      min: sql<number>`min(${products.costPrice})::int`,
    })
    .from(games)
    .innerJoin(products, eq(products.gameId, games.id))
    .where(and(eq(games.isActive, true), eq(products.isActive, true)))
    .groupBy(games.id, games.name, games.slug, games.imageUrl, games.category)
    .orderBy(asc(games.sortOrder), asc(games.name));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    imageUrl: r.imageUrl,
    category: r.category,
    minPrice: sellPrice(r.min ?? 0, role),
  }));
}

/**
 * Popular games ranked by actual transaction volume (order count from the
 * `orders` table). Games with more completed/paid orders rank higher. Games
 * with no orders yet fall back to their sort order. Returns max `limit` games.
 */
export async function getPopularGames(role: string, limit = 10) {
  const rows = await db
    .select({
      id: games.id,
      name: games.name,
      slug: games.slug,
      imageUrl: games.imageUrl,
      category: games.category,
      min: sql<number>`min(${products.costPrice})::int`,
      orderCount: sql<number>`count(${orders.id})::int`,
    })
    .from(games)
    .innerJoin(products, and(eq(products.gameId, games.id), eq(products.isActive, true)))
    .leftJoin(orders, eq(orders.gameId, games.id))
    .where(eq(games.isActive, true))
    .groupBy(games.id, games.name, games.slug, games.imageUrl, games.category)
    .orderBy(desc(sql`count(${orders.id})`), asc(games.sortOrder), asc(games.name))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    imageUrl: r.imageUrl,
    category: r.category,
    minPrice: r.min != null ? sellPrice(r.min, role) : null,
    orderCount: r.orderCount,
  }));
}

export async function getGameMinPrice(gameId: string, role: string): Promise<number | null> {
  if (USE_SUPABASE && supabase) {
    const { data } = await supabase
      .from("products")
      .select("cost_price")
      .eq("game_id", gameId)
      .eq("is_active", true)
      .order("cost_price")
      .limit(1);
    if (!data?.length) return null;
    return sellPrice(data[0].cost_price, role);
  }
  const rows = await db
    .select({ min: sql<number>`min(${products.costPrice})::int` })
    .from(products)
    .where(and(eq(products.gameId, gameId), eq(products.isActive, true)));
  const min = rows[0]?.min;
  return min != null ? sellPrice(min, role) : null;
}

/* ============================================================
 * Flash sales
 * ========================================================== */
export type FlashSaleCard = {
  saleId: string;
  productId: string;
  gameName: string;
  gameSlug: string;
  itemName: string;
  denomination: string | null;
  sku: string | null;
  imageUrl: string;
  originalPrice: number;
  salePrice: number;
  discountLabel: string;
  endAt: Date;
  stockLimit: number | null;
  soldCount: number;
};

export function applyDiscount(original: number, type: "percentage" | "fixed", value: number) {
  if (type === "percentage") return Math.round(original * (1 - value / 100));
  return Math.max(0, original - value);
}

export type SaleInfo = {
  id: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  endAt: Date;
  stockLimit: number | null;
  soldCount: number;
};

function buildSaleCard(
  base: { id: string; discountType: "percentage" | "fixed"; discountValue: number; endAt: Date; stockLimit: number | null; soldCount: number },
  product: { id: string; itemName: string; denomination: string | null; sku: string | null; costPrice: number },
  game: { name: string; slug: string; imageUrl: string },
  role: string
): FlashSaleCard {
  const original = sellPrice(product.costPrice, role);
  const salePrice = applyDiscount(original, base.discountType, base.discountValue);
  return {
    saleId: base.id,
    productId: product.id,
    gameName: game.name,
    gameSlug: game.slug,
    itemName: product.itemName,
    denomination: product.denomination,
    sku: product.sku,
    imageUrl: game.imageUrl,
    originalPrice: original,
    salePrice,
    discountLabel:
      base.discountType === "percentage" ? `${base.discountValue}% OFF` : `Hemat ${formatRupiah(base.discountValue)}`,
    endAt: base.endAt,
    stockLimit: base.stockLimit,
    soldCount: base.soldCount,
  };
}

export async function getActiveFlashSales(role: string): Promise<FlashSaleCard[]> {
  const now = new Date();
  if (USE_SUPABASE && supabase) {
    const { data: sales } = await supabase
      .from("flash_sales")
      .select("*")
      .lte("start_at", now.toISOString())
      .gte("end_at", now.toISOString());
    const cards: FlashSaleCard[] = [];
    for (const s of sales ?? []) {
      if (s.stock_limit != null && s.sold_count >= s.stock_limit) continue;
      const { data: product } = await supabase.from("products").select("*").eq("id", s.product_id).limit(1).single();
      if (!product) continue;
      const { data: game } = await supabase
        .from("games")
        .select("name,slug,image_url")
        .eq("id", product.game_id)
        .limit(1)
        .single();
      if (!game) continue;
      cards.push(
        buildSaleCard(
          {
            id: s.id,
            discountType: s.discount_type,
            discountValue: s.discount_value,
            endAt: new Date(s.end_at),
            stockLimit: s.stock_limit,
            soldCount: s.sold_count,
          },
          { id: product.id, itemName: product.item_name, denomination: product.denomination, sku: product.sku, costPrice: product.cost_price },
          { name: game.name, slug: game.slug, imageUrl: game.image_url },
          role
        )
      );
    }
    return cards.sort((a, b) => a.endAt.getTime() - b.endAt.getTime());
  }

  const rows = await db
    .select({ sale: flashSales, product: products, game: games })
    .from(flashSales)
    .innerJoin(products, eq(products.id, flashSales.productId))
    .innerJoin(games, eq(games.id, products.gameId))
    .where(and(lte(flashSales.startAt, now), gte(flashSales.endAt, now)));
  const cards: FlashSaleCard[] = [];
  for (const r of rows) {
    if (r.sale.stockLimit != null && r.sale.soldCount >= r.sale.stockLimit) continue;
    cards.push(
      buildSaleCard(
        { id: r.sale.id, discountType: r.sale.discountType, discountValue: r.sale.discountValue, endAt: r.sale.endAt, stockLimit: r.sale.stockLimit, soldCount: r.sale.soldCount },
        { id: r.product.id, itemName: r.product.itemName, denomination: r.product.denomination, sku: r.product.sku, costPrice: r.product.costPrice },
        { name: r.game.name, slug: r.game.slug, imageUrl: r.game.imageUrl },
        role
      )
    );
  }
  return cards.sort((a, b) => a.endAt.getTime() - b.endAt.getTime());
}

/** Active flash sale for a single product (null if none or sold out). */
export async function getActiveFlashSaleForProduct(productId: string): Promise<SaleInfo | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(flashSales)
    .where(and(eq(flashSales.productId, productId), lte(flashSales.startAt, now), gte(flashSales.endAt, now)))
    .limit(1);
  const s = rows[0];
  if (!s) return null;
  if (s.stockLimit != null && s.soldCount >= s.stockLimit) return null;
  return { id: s.id, discountType: s.discountType, discountValue: s.discountValue, endAt: s.endAt, stockLimit: s.stockLimit, soldCount: s.soldCount };
}

/** Map of productId -> active sale for all products of a game. */
export async function getActiveFlashSalesForGame(gameId: string): Promise<Record<string, SaleInfo>> {
  const now = new Date();
  const rows = await db
    .select({ sale: flashSales, productId: products.id })
    .from(flashSales)
    .innerJoin(products, eq(products.id, flashSales.productId))
    .where(and(eq(products.gameId, gameId), lte(flashSales.startAt, now), gte(flashSales.endAt, now)));
  const map: Record<string, SaleInfo> = {};
  for (const r of rows) {
    if (r.sale.stockLimit != null && r.sale.soldCount >= r.sale.stockLimit) continue;
    map[r.productId] = { id: r.sale.id, discountType: r.sale.discountType, discountValue: r.sale.discountValue, endAt: r.sale.endAt, stockLimit: r.sale.stockLimit, soldCount: r.sale.soldCount };
  }
  return map;
}

/* ============================================================
 * Recent roulette wins (ticker)
 * ========================================================== */
// Always read SERVER-SIDE via Drizzle: this joins the private `users` table, so
// it must NOT use the public anon key (RLS would block it, and we never expose
// user data to the browser). The service-role/postgres connection bypasses RLS.
export async function getRecentWins(limit = 14) {
  const rows = await db
    .select({ name: users.name, prizeLabel: rouletteSpins.prizeLabel, createdAt: rouletteSpins.createdAt })
    .from(rouletteSpins)
    .innerJoin(users, eq(users.id, rouletteSpins.userId))
    .orderBy(desc(rouletteSpins.createdAt))
    .limit(limit);
  return rows;
}

/* ============================================================
 * Exclusive events (Hadiah)
 * ========================================================== */
export async function getActiveEvents() {
  const now = new Date();
  if (USE_SUPABASE && supabase) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .lte("start_date", now.toISOString())
      .gte("end_date", now.toISOString())
      .order("created_at");
    return (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      bannerImage: r.banner_image,
      startDate: new Date(r.start_date),
      endDate: new Date(r.end_date),
      tierVisibility: r.tier_visibility,
      creditCost: r.credit_cost,
      eventType: r.event_type,
      config: r.config,
      status: r.status,
      createdAt: new Date(r.created_at),
    }));
  }
  return db
    .select()
    .from(events)
    .where(and(lte(events.startDate, now), gte(events.endDate, now), eq(events.status, "active")))
    .orderBy(asc(events.createdAt));
}

/* ============================================================
 * News (Berita) — public, all roles + guests
 * ========================================================== */
export async function getPublishedNews(limit = 50) {
  return db
    .select()
    .from(news)
    .where(eq(news.isPublished, true))
    .orderBy(desc(news.pinned), desc(news.createdAt))
    .limit(limit);
}

export async function getNewsById(id: string) {
  const rows = await db
    .select()
    .from(news)
    .where(and(eq(news.id, id), eq(news.isPublished, true)))
    .limit(1);
  return rows[0] ?? null;
}
