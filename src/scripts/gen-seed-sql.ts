/**
 * Generates supabase/seed-data.sql from the app's own data modules so the SQL
 * always matches the code. Run with: npx tsx src/scripts/gen-seed-sql.ts
 */
import { writeFileSync } from "fs";
import { DEFAULT_SITE } from "../lib/site";
import { MOCK_CATALOG } from "../lib/integrations";
import { DEFAULT_ROULETTE_PRIZES, DEFAULT_CREDIT_PER_RUPIAH, PAYMENT_METHODS } from "../lib/constants";
import { SECRET_DEFS } from "../lib/secrets";

// Same game metadata as seed.ts (kept here so this script is self-contained).
const GAMES = [
  { name: "Mobile Legends", slug: "mobile-legends", publisher: "Moonton", category: "MOBA", imageUrl: "https://images.pexels.com/photos/9072394/pexels-photo-9072394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: true, idFieldLabel: "User ID", serverFieldLabel: "Zone ID", idPlaceholder: "Contoh: 123456789", description: "Top up Diamond Mobile Legends: Bang Bang. Masukkan User ID dan Zone ID dari profil in-game." },
  { name: "Free Fire", slug: "free-fire", publisher: "Garena", category: "Battle Royale", imageUrl: "https://images.pexels.com/photos/11450707/pexels-photo-11450707.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "ID Player", serverFieldLabel: "Server", idPlaceholder: "Contoh: 123456789", description: "Top up Diamond Free Fire. Cukup masukkan ID Player yang tertera pada profil akun." },
  { name: "PUBG Mobile", slug: "pubg-mobile", publisher: "Tencent", category: "Shooter", imageUrl: "https://images.pexels.com/photos/17266184/pexels-photo-17266184.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "Character ID", serverFieldLabel: "Server", idPlaceholder: "Contoh: 5123456789", description: "Top up Unknown Cash (UC) PUBG Mobile. Masukkan Character ID dari profil kamu." },
  { name: "Genshin Impact", slug: "genshin-impact", publisher: "HoYoverse", category: "RPG", imageUrl: "https://images.pexels.com/photos/12551746/pexels-photo-12551746.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "UID", serverFieldLabel: "Server", idPlaceholder: "Contoh: 812345678", description: "Top up Genesis Crystal Genshin Impact. Masukkan UID dan pilih server." },
  { name: "Honkai Impact 3rd", slug: "honkai-impact", publisher: "HoYoverse", category: "RPG", imageUrl: "https://images.pexels.com/photos/37421708/pexels-photo-37421708.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "UID", serverFieldLabel: "Server", idPlaceholder: "Contoh: 112345678", description: "Top up Crystal Honkai Impact 3rd. Masukkan UID akun kamu." },
  { name: "Valorant", slug: "valorant", publisher: "Riot Games", category: "Shooter", imageUrl: "https://images.pexels.com/photos/3678428/pexels-photo-3678428.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "Riot ID", serverFieldLabel: "Region", idPlaceholder: "Contoh: Player#TAG", description: "Top up Valorant Points (VP). Masukkan Riot ID lengkap dengan tagline." },
  { name: "Call of Duty Mobile", slug: "cod-mobile", publisher: "Activision", category: "Shooter", imageUrl: "https://images.pexels.com/photos/6841030/pexels-photo-6841030.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "ID Player", serverFieldLabel: "Server", idPlaceholder: "Contoh: 1234567890", description: "Top up CP (COD Points) Call of Duty Mobile. Masukkan ID Player." },
  { name: "Honkai: Star Rail", slug: "honkai-star-rail", publisher: "HoYoverse", category: "RPG", imageUrl: "https://images.pexels.com/photos/32417608/pexels-photo-32417608.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "UID", serverFieldLabel: "Server", idPlaceholder: "Contoh: 812345678", description: "Top up Oneiric Shard Honkai: Star Rail. Masukkan UID dan pilih server." },
  { name: "Token Listrik (PLN)", slug: "token-listrik", publisher: "PLN", category: "Pulsa & Tagihan", imageUrl: "https://images.pexels.com/photos/2883028/pexels-photo-2883028.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "ID Pelanggan / Meter", serverFieldLabel: "Server", idPlaceholder: "Contoh: 12345678901", description: "Beli token listrik prabayar PLN. Masukkan ID Pelanggan atau nomor meter." },
  { name: "Pulsa & Paket Data", slug: "pulsa-data", publisher: "All Operator", category: "Pulsa & Tagihan", imageUrl: "https://images.pexels.com/photos/7773732/pexels-photo-7773732.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", needsServerId: false, idFieldLabel: "Nomor HP", serverFieldLabel: "Operator", idPlaceholder: "Contoh: 0812xxxxxxxx", description: "Isi pulsa dan paket data semua operator. Masukkan nomor HP tujuan." },
];

const sql = (s: string) => `'${String(s).replace(/'/g, "''")}'`;
const bool = (b: boolean) => (b ? "true" : "false");
const now = "now()";

let out = `-- ============================================================================
-- NexusTop — SEED DATA (run AFTER supabase/setup.sql)
--
-- Pre-loads: website settings (site config), API key placeholders, roulette
-- config, games, products, banners, and events — so your Supabase project is
-- ready to use immediately. Safe to re-run (guarded with NOT EXISTS).
--
-- After this, control everything from the Supabase Table Editor:
--   - settings  → key='site' holds website name, contact, SEO, favicon, social
--   - settings  → key='secret_*' holds the API keys (fill in real values)
--   - games / products → your catalog
-- ============================================================================

`;

// ---- settings: site config (the website settings you control) ----
out += "-- ---------- Website settings (key = 'site') ----------\n";
out += `INSERT INTO settings (key, value, updated_at)\nVALUES ('site', ${sql(JSON.stringify(DEFAULT_SITE))}, ${now})\nON CONFLICT (key) DO NOTHING;\n\n`;

// ---- settings: API key placeholders ----
out += "-- ---------- API key placeholders (fill real values in Table Editor) ----------\n";
for (const d of SECRET_DEFS) {
  out += `INSERT INTO settings (key, value, updated_at)\nVALUES ('${d.key}', ${sql(d.fallback ?? "")}, ${now})\nON CONFLICT (key) DO NOTHING;\n`;
}
out += "\n";

// ---- settings: roulette + credit rate ----
out += "-- ---------- Roulette prizes & credit rate ----------\n";
out += `INSERT INTO settings (key, value, updated_at)\nVALUES ('roulette_prizes', ${sql(JSON.stringify(DEFAULT_ROULETTE_PRIZES))}, ${now})\nON CONFLICT (key) DO NOTHING;\n`;
out += `INSERT INTO settings (key, value, updated_at)\nVALUES ('credit_per_rupiah', ${sql(JSON.stringify(DEFAULT_CREDIT_PER_RUPIAH))}, ${now})\nON CONFLICT (key) DO NOTHING;\n\n`;

// Map catalog gameName -> game slug (catalog uses display names, games use slugs)
const nameToSlug = new Map(GAMES.map((g) => [g.name, g.slug]));

// ---- games ----
out += "-- ---------- Games ----------\n";
out += "INSERT INTO games (name, slug, publisher, image_url, category, needs_server_id, id_field_label, server_field_label, id_placeholder, description, is_active, sort_order, created_at)\nVALUES\n";
out += GAMES.map(
  (g, i) =>
    `(${sql(g.name)}, ${sql(g.slug)}, ${sql(g.publisher)}, ${sql(g.imageUrl)}, ${sql(g.category)}, ${bool(g.needsServerId)}, ${sql(g.idFieldLabel)}, ${sql(g.serverFieldLabel)}, ${sql(g.idPlaceholder)}, ${sql(g.description)}, true, ${i}, ${now})`
).join(",\n");
out += "\nON CONFLICT (slug) DO NOTHING;\n\n";

// ---- products (reference game by slug, derived from catalog gameName) ----
out += "-- ---------- Products ----------\n";
let prodOrder = 0;
for (const p of MOCK_CATALOG) {
  const slug = nameToSlug.get(p.gameName) ?? p.gameName;
  out += `INSERT INTO products (game_id, sku, item_name, denomination, cost_price, provider, is_active, sort_order, created_at, updated_at)\nSELECT id, ${sql(p.sku)}, ${sql(p.itemName)}, ${sql(p.denomination)}, ${p.costPrice}, ${sql(p.provider)}, true, ${prodOrder++}, ${now}, ${now} FROM games WHERE slug = ${sql(slug)}\nAND NOT EXISTS (SELECT 1 FROM products WHERE sku = ${sql(p.sku)} AND game_id = (SELECT id FROM games WHERE slug = ${sql(slug)}));\n`;
}
out += "\n";

// ---- banners ----
out += "-- ---------- Banners ----------\n";
const banners = [
  { imageUrl: "/banners/flash-sale.jpg", title: "Flash Sale Spesial", subtitle: "Diskon hingga 20% untuk diamond & UC favoritmu. Terbatas!", ctaText: "Belanja Sekarang", ctaLink: "/#flash-sale", sortOrder: 0 },
  { imageUrl: "/banners/deposit.jpg", title: "Deposit Saldo, Lebih Cepat", subtitle: "Simpan saldo sekali, top-up tanpa repot bayar berulang.", ctaText: "Isi Saldo", ctaLink: "/balance", sortOrder: 1 },
  { imageUrl: "/banners/roulette.jpg", title: "Spin & Menangkan Hadiah", subtitle: "Setiap transaksi sukses memberimu Spin Credit di Event Roulette.", ctaText: "Coba Roulette", ctaLink: "/event", sortOrder: 2 },
];
out += "INSERT INTO banners (image_url, title, subtitle, cta_text, cta_link, sort_order, is_active, created_at)\nVALUES\n";
out += banners.map((b) => `(${sql(b.imageUrl)}, ${sql(b.title)}, ${sql(b.subtitle)}, ${sql(b.ctaText)}, ${sql(b.ctaLink)}, ${b.sortOrder}, true, ${now})`).join(",\n");
out += "\nON CONFLICT DO NOTHING;\n\n";

// ---- events ----
out += "-- ---------- Exclusive events (Hadiah) ----------\n";
const events = [
  { title: "Weekly Spend Leaderboard", desc: "Bertanding dengan pengeluaran top-up mingguanmu. Top 3 memenangkan voucher + bonus Spin Credit!", banner: "/banners/deposit.jpg", vis: "both", cost: 0, type: "leaderboard", cfg: { prizePool: 150000, topN: 3 } },
  { title: "Mystery Box: Silver & Gold", desc: "Tukar 2 Spin Credit untuk membuka Mystery Box. Langganan = Silver Box, Sultan = Gold Box dengan hadiah lebih besar.", banner: "/banners/roulette.jpg", vis: "both", cost: 2, type: "mystery_box", cfg: { silver: ["Voucher Rp2.000", "+1 Credit", "Cashback Rp1.000"], gold: ["Voucher Rp5.000", "+2 Credit", "Cashback Rp3.000", "Diskon 5%"] } },
  { title: "Login Streak Bonus", desc: "Check-in gratis setiap hari. Kumpulkan streak hingga hari ke-7, 14, dan 30 untuk bonus bertahap.", banner: "/banners/flash-sale.jpg", vis: "both", cost: 0, type: "login_streak", cfg: { milestones: { 7: 1, 14: 2, 30: 5 } } },
];
out += "INSERT INTO events (title, description, banner_image, start_date, end_date, tier_visibility, credit_cost, event_type, config, status, created_at)\nVALUES\n";
out += events
  .map(
    (e) =>
      `(${sql(e.title)}, ${sql(e.desc)}, ${sql(e.banner)}, ${now}, now() + interval '30 days', ${sql(e.vis)}, ${e.cost}, ${sql(e.type)}, ${sql(JSON.stringify(e.cfg))}, 'active', ${now})`
  )
  .join(",\n");
out += "\nON CONFLICT DO NOTHING;\n";

// ---- flash sales (reference products by sku) ----
out += `
-- ---------- Flash sales ----------\n`;
const sales = [
  { sku: "FF-70", type: "percentage", value: 10, stock: 40 },
  { sku: "MLBB-86", type: "fixed", value: 1500, stock: 25 },
  { sku: "PUBG-60", type: "percentage", value: 8, stock: 30 },
];
for (const s of sales) {
  out += `INSERT INTO flash_sales (product_id, discount_type, discount_value, start_at, end_at, stock_limit, sold_count, status, created_at)\nSELECT id, ${sql(s.type)}, ${s.value}, now() - interval '1 hour', now() + interval '2 days', ${s.stock}, 0, 'active', ${now} FROM products WHERE sku = ${sql(s.sku)}\nAND NOT EXISTS (SELECT 1 FROM flash_sales WHERE product_id = (SELECT id FROM products WHERE sku = ${sql(s.sku)}));\n`;
}

out += `
-- ============================================================================
-- Done. Edit any of these rows directly in the Supabase Table Editor:
--   - Table "settings", key = 'site'  → website name, contact, SEO, favicon, social links
--   - Table "settings", key = 'secret_*' → paste your real API keys
--   - Tables "games" / "products" → manage your catalog
--   - Tables "banners" / "events" / "flash_sales" → manage promotions
-- ============================================================================\n`;

writeFileSync("supabase/seed-data.sql", out, "utf8");
console.log(`Wrote supabase/seed-data.sql (${out.length} bytes, ${GAMES.length} games, ${MOCK_CATALOG.length} products).`);
// keep PAYMENT_METHODS import referenced for type-safety of the generator
void PAYMENT_METHODS;
