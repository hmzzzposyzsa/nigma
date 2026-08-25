import "dotenv/config";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  games,
  products,
  banners,
  flashSales,
  events,
  rouletteSpins,
  settings,
} from "../db/schema";
import { MOCK_CATALOG } from "../lib/integrations";
import { DEFAULT_ROULETTE_PRIZES, DEFAULT_CREDIT_PER_RUPIAH } from "../lib/constants";
import { hashPassword } from "../lib/auth";
import { SECRET_DEFS } from "../lib/secrets";
import { DEFAULT_SITE } from "../lib/site";

type GameSeed = {
  name: string;
  slug: string;
  publisher?: string;
  code: string;
  category: string;
  imageUrl: string;
  needsServerId: boolean;
  idFieldLabel: string;
  serverFieldLabel: string;
  idPlaceholder: string;
  description: string;
};

const GAMES: GameSeed[] = [
  {
    name: "Mobile Legends",
    slug: "mobile-legends",
    publisher: "Moonton",
    code: "mlbb",
    category: "MOBA",
    imageUrl: "https://images.pexels.com/photos/9072394/pexels-photo-9072394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: true,
    idFieldLabel: "User ID",
    serverFieldLabel: "Zone ID",
    idPlaceholder: "Contoh: 123456789",
    description: "Top up Diamond Mobile Legends: Bang Bang. Masukkan User ID dan Zone ID dari profil in-game.",
  },
  {
    name: "Free Fire",
    slug: "free-fire",
    publisher: "Garena",
    code: "freefire",
    category: "Battle Royale",
    imageUrl: "https://images.pexels.com/photos/11450707/pexels-photo-11450707.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "ID Player",
    serverFieldLabel: "Server",
    idPlaceholder: "Contoh: 123456789",
    description: "Top up Diamond Free Fire. Cukup masukkan ID Player yang tertera pada profil akun.",
  },
  {
    name: "PUBG Mobile",
    slug: "pubg-mobile",
    publisher: "Tencent",
    code: "pubgm",
    category: "Shooter",
    imageUrl: "https://images.pexels.com/photos/17266184/pexels-photo-17266184.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "Character ID",
    serverFieldLabel: "Server",
    idPlaceholder: "Contoh: 5123456789",
    description: "Top up Unknown Cash (UC) PUBG Mobile. Masukkan Character ID dari profil kamu.",
  },
  {
    name: "Genshin Impact",
    slug: "genshin-impact",
    publisher: "HoYoverse",
    code: "genshin",
    category: "RPG",
    imageUrl: "https://images.pexels.com/photos/12551746/pexels-photo-12551746.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "UID",
    serverFieldLabel: "Server",
    idPlaceholder: "Contoh: 812345678",
    description: "Top up Genesis Crystal Genshin Impact. Masukkan UID dan pilih server.",
  },
  {
    name: "Honkai Impact 3rd",
    slug: "honkai-impact",
    publisher: "HoYoverse",
    code: "honkai",
    category: "RPG",
    imageUrl: "https://images.pexels.com/photos/37421708/pexels-photo-37421708.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "UID",
    serverFieldLabel: "Server",
    idPlaceholder: "Contoh: 112345678",
    description: "Top up Crystal Honkai Impact 3rd. Masukkan UID akun kamu.",
  },
  {
    name: "Valorant",
    slug: "valorant",
    publisher: "Riot Games",
    code: "valorant",
    category: "Shooter",
    imageUrl: "https://images.pexels.com/photos/3678428/pexels-photo-3678428.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "Riot ID",
    serverFieldLabel: "Region",
    idPlaceholder: "Contoh: Player#TAG",
    description: "Top up Valorant Points (VP). Masukkan Riot ID lengkap dengan tagline.",
  },
  {
    name: "Call of Duty Mobile",
    slug: "cod-mobile",
    publisher: "Activision",
    code: "codm",
    category: "Shooter",
    imageUrl: "https://images.pexels.com/photos/6841030/pexels-photo-6841030.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "ID Player",
    serverFieldLabel: "Server",
    idPlaceholder: "Contoh: 1234567890",
    description: "Top up CP (COD Points) Call of Duty Mobile. Masukkan ID Player.",
  },
  {
    name: "Honkai: Star Rail",
    slug: "honkai-star-rail",
    publisher: "HoYoverse",
    code: "hsr",
    category: "RPG",
    imageUrl: "https://images.pexels.com/photos/32417608/pexels-photo-32417608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "UID",
    serverFieldLabel: "Server",
    idPlaceholder: "Contoh: 812345678",
    description: "Top up Oneiric Shard Honkai: Star Rail. Masukkan UID dan pilih server.",
  },
  {
    name: "Token Listrik (PLN)",
    slug: "token-listrik",
    publisher: "PLN",
    code: "pln",
    category: "Pulsa & Tagihan",
    imageUrl: "https://images.pexels.com/photos/2883028/pexels-photo-2883028.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "ID Pelanggan / Meter",
    serverFieldLabel: "Server",
    idPlaceholder: "Contoh: 12345678901",
    description: "Beli token listrik prabayar PLN. Masukkan ID Pelanggan atau nomor meter.",
  },
  {
    name: "Pulsa & Paket Data",
    slug: "pulsa-data",
    publisher: "All Operator",
    code: "pulsa",
    category: "Pulsa & Tagihan",
    imageUrl: "https://images.pexels.com/photos/7773732/pexels-photo-7773732.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    needsServerId: false,
    idFieldLabel: "Nomor HP",
    serverFieldLabel: "Operator",
    idPlaceholder: "Contoh: 0812xxxxxxxx",
    description: "Isi pulsa dan paket data semua operator. Masukkan nomor HP tujuan.",
  },
];

async function upsertUser(data: typeof users.$inferInsert) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email as string))
    .limit(1);
  if (existing[0]) {
    await db.update(users).set(data).where(eq(users.id, existing[0].id));
    return existing[0].id;
  }
  const [row] = await db.insert(users).values(data).returning({ id: users.id });
  return row.id;
}

async function main() {
  console.log("Seeding database...");

  // Demo account (Sultan tier so the Hadiah/leaderboard features are visible)
  const demoId = await upsertUser({
    email: "demo@nexustop.id",
    name: "Budi Hartono",
    passwordHash: await hashPassword("demo123"),
    role: "sultan",
    lastMonthRole: "sultan",
    balance: 78000,
    creditBalance: 14,
    monthlySpend: 620000,
    totalSpend: 1340000,
    streakDays: 4,
  });

  // Ticker / leaderboard personas (no login)
  const personas = ["Sari Lestari", "Andi Wijaya", "Dewi Anggraini", "Rian Pratama", "Putra Nugroho"];
  const personaIds: string[] = [];
  for (const name of personas) {
    const phone = "62" + Math.floor(81000000000 + Math.random() * 89999999);
    const id = await upsertUser({
      phone,
      name,
      role: Math.random() > 0.5 ? "langganan" : "pemula",
      balance: Math.floor(Math.random() * 60000),
      creditBalance: Math.floor(Math.random() * 8),
      monthlySpend: Math.floor(Math.random() * 520000),
      totalSpend: Math.floor(Math.random() * 2000000),
    });
    personaIds.push(id);
  }

  // Games
  const gameByCode: Record<string, string> = {};
  for (let i = 0; i < GAMES.length; i++) {
    const g = GAMES[i];
    const existing = await db.select().from(games).where(eq(games.slug, g.slug)).limit(1);
    let id: string;
    if (existing[0]) {
      const { code: _omit, ...rest } = g;
      await db
        .update(games)
        .set({ ...rest, sortOrder: i })
        .where(eq(games.id, existing[0].id));
      id = existing[0].id;
    } else {
      const [row] = await db
        .insert(games)
        .values({
          name: g.name,
          slug: g.slug,
          publisher: g.publisher,
          category: g.category,
          imageUrl: g.imageUrl,
          needsServerId: g.needsServerId,
          idFieldLabel: g.idFieldLabel,
          serverFieldLabel: g.serverFieldLabel,
          idPlaceholder: g.idPlaceholder,
          description: g.description,
          sortOrder: i,
          isActive: true,
        })
        .returning({ id: games.id });
      id = row.id;
    }
    gameByCode[g.name] = id;
  }

  // Products (derived from the ApiGames/SekaliPay catalog shape)
  await db.delete(products);
  let order = 0;
  for (const p of MOCK_CATALOG) {
    const gameId = gameByCode[p.gameName];
    if (!gameId) continue;
    await db.insert(products).values({
      gameId,
      sku: p.sku,
      itemName: p.itemName,
      denomination: p.denomination,
      costPrice: p.costPrice,
      provider: p.provider,
      isActive: true,
      sortOrder: order++,
    });
  }
  console.log(`Seeded ${order} products.`);

  // Banners
  await db.delete(banners);
  await db.insert(banners).values([
    {
      imageUrl: "/banners/flash-sale.jpg",
      title: "Flash Sale Spesial",
      subtitle: "Diskon hingga 20% untuk diamond & UC favoritmu. Terbatas!",
      ctaText: "Belanja Sekarang",
      ctaLink: "/#flash-sale",
      sortOrder: 0,
      isActive: true,
    },
    {
      imageUrl: "/banners/deposit.jpg",
      title: "Deposit Saldo, Lebih Cepat",
      subtitle: "Simpan saldo sekali, top-up tanpa repot bayar berulang.",
      ctaText: "Isi Saldo",
      ctaLink: "/balance",
      sortOrder: 1,
      isActive: true,
    },
    {
      imageUrl: "/banners/roulette.jpg",
      title: "Spin & Menangkan Hadiah",
      subtitle: "Setiap transaksi sukses memberimu Spin Credit di Event Roulette.",
      ctaText: "Coba Roulette",
      ctaLink: "/event",
      sortOrder: 2,
      isActive: true,
    },
  ]);

  // Flash sales
  await db.delete(flashSales);
  const ff70 = await db
    .select()
    .from(products)
    .where(and(eq(products.sku, "FF-70"), eq(products.provider, "apigames")))
    .limit(1);
  const mlbb86 = await db
    .select()
    .from(products)
    .where(and(eq(products.sku, "MLBB-86"), eq(products.provider, "apigames")))
    .limit(1);
  const pubg60 = await db
    .select()
    .from(products)
    .where(eq(products.sku, "PUBG-60"))
    .limit(1);
  const now = Date.now();
  const saleRows = [];
  if (ff70[0]) saleRows.push({ productId: ff70[0].id, discountType: "percentage" as const, discountValue: 10, startAt: new Date(now - 3_600_000), endAt: new Date(now + 2 * 86_400_000), stockLimit: 40, status: "active" });
  if (mlbb86[0]) saleRows.push({ productId: mlbb86[0].id, discountType: "fixed" as const, discountValue: 1500, startAt: new Date(now - 3_600_000), endAt: new Date(now + 86_400_000), stockLimit: 25, status: "active" });
  if (pubg60[0]) saleRows.push({ productId: pubg60[0].id, discountType: "percentage" as const, discountValue: 8, startAt: new Date(now - 3_600_000), endAt: new Date(now + 3 * 86_400_000), stockLimit: 30, status: "active" });
  if (saleRows.length) await db.insert(flashSales).values(saleRows);

  // Events (Hadiah)
  await db.delete(events);
  await db.insert(events).values([
    {
      title: "Weekly Spend Leaderboard",
      description: "Bertanding dengan pengeluaran top-up mingguanmu. Top 3 memenangkan voucher + bonus Spin Credit!",
      bannerImage: "/banners/deposit.jpg",
      startDate: new Date(now - 86_400_000),
      endDate: new Date(now + 6 * 86_400_000),
      tierVisibility: "both",
      creditCost: 0,
      eventType: "leaderboard",
      config: { prizePool: 150000, topN: 3 },
      status: "active",
    },
    {
      title: "Mystery Box: Silver & Gold",
      description: "Tukar 2 Spin Credit untuk membuka Mystery Box. Langganan = Silver Box, Sultan = Gold Box dengan hadiah lebih besar.",
      bannerImage: "/banners/roulette.jpg",
      startDate: new Date(now - 86_400_000),
      endDate: new Date(now + 14 * 86_400_000),
      tierVisibility: "both",
      creditCost: 2,
      eventType: "mystery_box",
      config: { silver: ["Voucher Rp2.000", "+1 Credit", "Cashback Rp1.000"], gold: ["Voucher Rp5.000", "+2 Credit", "Cashback Rp3.000", "Voucher 5%"] },
      status: "active",
    },
    {
      title: "Login Streak Bonus",
      description: "Check-in gratis setiap hari. Kumpulkan streak hingga hari ke-7, 14, dan 30 untuk bonus bertahap.",
      bannerImage: "/banners/flash-sale.jpg",
      startDate: new Date(now - 86_400_000),
      endDate: new Date(now + 30 * 86_400_000),
      tierVisibility: "both",
      creditCost: 0,
      eventType: "login_streak",
      config: { milestones: { 7: 1, 14: 2, 30: 5 } },
      status: "active",
    },
  ]);

  // Recent wins ticker
  await db.delete(rouletteSpins);
  const tickerPrizes = [
    { segment: 3, type: "cashback", label: "Cashback Rp1.000", value: 1000 },
    { segment: 1, type: "cashback", label: "Cashback Rp500", value: 500 },
    { segment: 6, type: "cashback", label: "Cashback Rp2.500", value: 2500 },
    { segment: 4, type: "credit", label: "+1 Spin Credit", value: 1 },
    { segment: 2, type: "voucher_pct", label: "Diskon 2%", value: 2 },
    { segment: 3, type: "cashback", label: "Cashback Rp1.000", value: 1000 },
  ];
  const tickerUsers = [demoId, ...personaIds];
  const spinRows = tickerPrizes.map((p, i) => ({
    userId: tickerUsers[i % tickerUsers.length],
    segment: p.segment,
    prizeType: p.type,
    prizeLabel: p.label,
    prizeValue: p.value,
    createdAt: new Date(now - i * 1_800_000),
  }));
  await db.insert(rouletteSpins).values(spinRows);

  // Settings (admin-tunable defaults)
  await db
    .insert(settings)
    .values([
    { key: "credit_per_rupiah", value: JSON.stringify(DEFAULT_CREDIT_PER_RUPIAH) },
    { key: "roulette_prizes", value: JSON.stringify(DEFAULT_ROULETTE_PRIZES) },
  ])
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: sql`excluded.value` },
    });

  // Site-wide config (name, contact, SEO, favicon, social). Inserted once;
  // onConflictDoNothing so the admin's edits in the `site` key are never
  // overwritten by re-running the seed.
  await db
    .insert(settings)
    .values({ key: "site", value: JSON.stringify(DEFAULT_SITE) })
    .onConflictDoNothing();

  // Document integration secret keys (empty placeholders) in the settings table
  // so the separately-hosted admin panel can discover & populate them.
  // Values are filled via the admin panel or `PUT /api/config/secrets`.
  for (const def of SECRET_DEFS) {
    await db
      .insert(settings)
      .values({ key: def.key, value: def.fallback ?? "" })
      .onConflictDoUpdate({ target: settings.key, set: { value: def.fallback ?? "" } });
  }

  console.log(`Done. demo=${demoId}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
