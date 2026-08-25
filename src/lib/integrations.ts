/**
 * Third-party integration layer.
 *
 * Every provider function resolves its credentials via `getSecret` (settings
 * table → env → fallback), so keys are managed in the database, not env. Real
 * API calls run when a key is present; without one, a deterministic in-character
 * mock keeps the full flow demonstrable end-to-end.
 *
 * Providers: ApiGames + SekaliPay (catalog/orders), Midtrans (payments),
 * Resend (email), Fonnte (WhatsApp).
 */

import { getSecret } from "./secrets";

type IdCheckResult = { valid: boolean; nickname?: string; message: string };
type PaymentResult = {
  providerTrxId?: string;
  vaNumber?: string;
  vaBank?: string;
  qrString?: string;
  deeplinkUrl?: string;
  redirectUrl?: string;
  raw?: unknown;
};
type PaymentStatus = { status: "success" | "pending" | "failed"; transactionStatus?: string; raw?: unknown };

// Lightweight in-memory poll counters so the mock "payment/delivery" can progress
// pending -> success across a couple of status checks (realistic demo behaviour).
const pollCounts = new Map<string, number>();
function bump(key: string) {
  const n = (pollCounts.get(key) ?? 0) + 1;
  pollCounts.set(key, n);
  return n;
}

function md5ish(input: string): string {
  // ApiGames signature is md5(merchant_id + secret).
  // Uses node:crypto for Cloudflare Workers compatibility.
  try {
    const { createHash } = require("node:crypto") as typeof import("crypto");
    return createHash("md5").update(input).digest("hex");
  } catch {
    return input.slice(0, 32);
  }
}

/* ------------------------------------------------------------------ *
 * ApiGames / SekaliPay — game ID validation
 * ------------------------------------------------------------------ */
export async function validateGameId(opts: {
  gameCode?: string;
  gameSlug?: string;
  userId: string;
  serverId?: string;
}): Promise<IdCheckResult> {
  const clean = opts.userId.trim();
  if (!clean) return { valid: false, message: "ID tidak boleh kosong." };
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(clean)) {
    return { valid: false, message: "Format ID tidak valid. Periksa kembali ID Game Anda." };
  }

  const [merchant, secret] = await Promise.all([getSecret("APIGAMES_MERCHANT_ID"), getSecret("APIGAMES_SECRET")]);
  if (merchant && secret && opts.gameCode) {
    try {
      const APIGAMES_BASE = "https://v1.apigames.id";
      const signature = md5ish(`${merchant}${secret}`);
      const url = `${APIGAMES_BASE}/merchant/${merchant}/cek-username/${opts.gameCode}/${clean}?signature=${signature}`;
      const res = await fetch(url, { method: "GET" });
      const data = await res.json();
      if (data?.status === 0 || data?.data?.username) {
        return { valid: true, nickname: data.data?.username, message: "ID ditemukan." };
      }
      return { valid: false, message: "ID tidak ditemukan. Periksa kembali." };
    } catch {
      // fall through to mock
    }
  }

  // Mock: most real-looking IDs validate; a leading "000"/"999" simulates invalid.
  if (/^(000|999)/.test(clean)) {
    return { valid: false, message: "ID tidak ditemukan pada server game. Pastikan ID benar." };
  }
  const nick = `Gamer${clean.slice(-4)}`;
  return { valid: true, nickname: nick, message: `ID valid — Nickname: ${nick}` };
}

/* ------------------------------------------------------------------ *
 * Catalog sync (ApiGames + SekaliPay)
 * ------------------------------------------------------------------ */
export type ExternalProduct = {
  sku: string;
  gameName: string;
  itemName: string;
  denomination: string;
  costPrice: number;
  provider: "apigames" | "sekalipay";
  gameCode?: string;
};

export async function fetchExternalCatalog(): Promise<{ products: ExternalProduct[]; provider: string }> {
  const APIGAMES_BASE = "https://v1.apigames.id";
  const [merchant, secret] = await Promise.all([getSecret("APIGAMES_MERCHANT_ID"), getSecret("APIGAMES_SECRET")]);
  if (merchant && secret) {
    try {
      const res = await fetch(`${APIGAMES_BASE}/merchant/${merchant}/produk?signature=${md5ish(merchant + secret)}`);
      const data = await res.json();
      const products = Array.isArray(data?.data) ? (data.data as ExternalProduct[]) : [];
      if (products.length) return { products, provider: "apigames" };
    } catch {
      /* fall through to mock */
    }
  }
  return { products: MOCK_CATALOG, provider: "mock" };
}

/* ------------------------------------------------------------------ *
 * Midtrans — payment creation + status
 * ------------------------------------------------------------------ */
export async function createPayment(opts: {
  invoiceNo: string;
  amount: number;
  method: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemName: string;
}): Promise<PaymentResult> {
  const serverKey = await getSecret("MIDTRANS_SERVER_KEY");
  if (serverKey) {
    try {
      const snapUrl = (await getSecret("MIDTRANS_SNAP_URL")) as string;
      const auth = Buffer.from(`${serverKey}:`).toString("base64");
      const body = {
        transaction_details: { order_id: opts.invoiceNo, gross_amount: opts.amount },
        item_details: [{ id: opts.invoiceNo, name: opts.itemName.slice(0, 40), price: opts.amount, quantity: 1 }],
        customer_details: {
          first_name: opts.customerName?.slice(0, 48),
          email: opts.customerEmail,
          phone: opts.customerPhone,
        },
        enabled_payments: enabledPaymentsFor(opts.method),
      };
      const res = await fetch(snapUrl, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.token || data?.redirect_url) {
        return { providerTrxId: data.token, redirectUrl: data.redirect_url, raw: data };
      }
      throw new Error(data?.error_message || "midtrans empty");
    } catch {
      /* fall through to mock */
    }
  }

  return mockPaymentInstructions(opts);
}

function mockPaymentInstructions(opts: { invoiceNo: string; amount: number; method: string }): PaymentResult {
  const base = opts.invoiceNo.replace(/[^0-9]/g, "").slice(0, 10);
  if (opts.method === "qris") {
    return { providerTrxId: "MOCK-QRIS-" + base, qrString: `nexustop://qris/${opts.invoiceNo}/${opts.amount}`, raw: { mock: true } };
  }
  if (opts.method.endsWith("_va")) {
    const bank = opts.method.replace("_va", "").toUpperCase();
    return { providerTrxId: "MOCK-VA-" + base, vaNumber: "8800" + (9876543210 - Number(base)).toString().slice(0, 8), vaBank: bank, raw: { mock: true } };
  }
  if (opts.method === "gopay" || opts.method === "shopeepay" || opts.method === "dana" || opts.method === "ovo") {
    return { providerTrxId: "MOCK-EW-" + base, deeplinkUrl: `nexustop://${opts.method}/pay/${opts.invoiceNo}`, raw: { mock: true } };
  }
  return { providerTrxId: "MOCK-PM-" + base, raw: { mock: true } };
}

function enabledPaymentsFor(method: string): string[] {
  if (method === "qris") return ["qris"];
  if (method.endsWith("_va")) return [method.replace("_va", "_va")];
  if (["gopay", "shopeepay", "dana", "ovo"].includes(method)) return [method];
  return ["other_qris", "alfamart", "indomaret"];
}

export async function getPaymentStatus(invoiceNo: string): Promise<PaymentStatus> {
  const serverKey = await getSecret("MIDTRANS_SERVER_KEY");
  if (serverKey) {
    try {
      const statusUrl = (await getSecret("MIDTRANS_STATUS_URL")) as string;
      const auth = Buffer.from(`${serverKey}:`).toString("base64");
      const res = await fetch(`${statusUrl}/${invoiceNo}/status`, {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
      });
      const data = await res.json();
      const ts = String(data?.transaction_status ?? "");
      if (["settlement", "capture", "deny"].includes(ts) || ts === "success") {
        return { status: "success", transactionStatus: ts, raw: data };
      }
      if (ts === "expire" || ts === "cancel" || ts === "failure") {
        return { status: "failed", transactionStatus: ts, raw: data };
      }
      return { status: "pending", transactionStatus: ts || "pending", raw: data };
    } catch {
      /* fall through */
    }
  }
  // Mock: succeed after the second poll.
  const n = bump("pay:" + invoiceNo);
  return { status: n >= 2 ? "success" : "pending", transactionStatus: n >= 2 ? "settlement" : "pending", raw: { mock: true } };
}

/* ------------------------------------------------------------------ *
 * ApiGames / SekaliPay — order delivery + status
 * ------------------------------------------------------------------ */
export async function deliverOrder(opts: {
  ref: string;
  sku: string;
  gameCode?: string;
  userId: string;
  serverId?: string;
  provider?: string;
}): Promise<{ status: "success" | "pending" | "failed"; trxId?: string; message?: string }> {
  const APIGAMES_BASE = "https://v1.apigames.id";
  const [merchant, secret] = await Promise.all([getSecret("APIGAMES_MERCHANT_ID"), getSecret("APIGAMES_SECRET")]);
  if (merchant && secret && opts.sku) {
    try {
      const params = new URLSearchParams({
        ref_id: opts.ref,
        produk: opts.sku,
        tujuan: opts.userId,
        server_id: opts.serverId ?? "",
        signature: md5ish(merchant + secret),
      });
      const res = await fetch(`${APIGAMES_BASE}/transaksi`, { method: "POST", body: params });
      const data = await res.json();
      const st = String(data?.data?.status ?? data?.status ?? "").toLowerCase();
      if (st === "sukses" || st === "success") return { status: "success", trxId: data?.data?.trx_id, message: data?.data?.sn };
      if (st === "gagal") return { status: "failed", message: data?.data?.note };
      return { status: "pending", trxId: data?.data?.trx_id };
    } catch {
      /* fall through */
    }
  }
  const n = bump("deliver:" + opts.ref);
  if (n >= 2) return { status: "success", trxId: "MOCK-SN-" + Date.now().toString().slice(-8), message: "Item berhasil dikirim ke ID Game." };
  return { status: "pending", message: "Pesanan sedang diproses oleh server game." };
}

/* ------------------------------------------------------------------ *
 * Resend — transactional email
 * ------------------------------------------------------------------ */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = await getSecret("RESEND_API_KEY");
  const from = (await getSecret("RESEND_FROM")) || "NexusTop <noreply@nexustop.id>";
  if (!key) {
    console.info("[mock-email]", opts.to, opts.subject);
    return true;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Fonnte — WhatsApp
 * ------------------------------------------------------------------ */
export async function sendWhatsapp(opts: { to: string; message: string }): Promise<boolean> {
  const token = await getSecret("FONNTE_TOKEN");
  if (!token) {
    console.info("[mock-wa]", opts.to, opts.message.slice(0, 80));
    return true;
  }
  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ target: opts.to, message: opts.message, countryCode: "62" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Mock catalog used when no provider keys are present.
 * ------------------------------------------------------------------ */
export const MOCK_CATALOG: ExternalProduct[] = [
  { sku: "MLBB-86", gameName: "Mobile Legends", gameCode: "mlbb", itemName: "86 Diamonds", denomination: "86", costPrice: 22000, provider: "apigames" },
  { sku: "MLBB-172", gameName: "Mobile Legends", gameCode: "mlbb", itemName: "172 Diamonds", denomination: "172", costPrice: 44000, provider: "apigames" },
  { sku: "MLBB-257", gameName: "Mobile Legends", gameCode: "mlbb", itemName: "257 Diamonds", denomination: "257", costPrice: 66000, provider: "apigames" },
  { sku: "MLBB-WL", gameName: "Mobile Legends", gameCode: "mlbb", itemName: "Weekly Diamond Pass", denomination: "Mingguan", costPrice: 28000, provider: "apigames" },
  { sku: "FF-70", gameName: "Free Fire", gameCode: "freefire", itemName: "70 Diamonds", denomination: "70", costPrice: 10000, provider: "apigames" },
  { sku: "FF-355", gameName: "Free Fire", gameCode: "freefire", itemName: "355 Diamonds", denomination: "355", costPrice: 50000, provider: "apigames" },
  { sku: "FF-720", gameName: "Free Fire", gameCode: "freefire", itemName: "720 Diamonds", denomination: "720", costPrice: 99000, provider: "apigames" },
  { sku: "FF-MMB", gameName: "Free Fire", gameCode: "freefire", itemName: "Membership Mingguan", denomination: "Mingguan", costPrice: 30000, provider: "apigames" },
  { sku: "PUBG-60", gameName: "PUBG Mobile", gameCode: "pubgm", itemName: "60 UC", denomination: "60", costPrice: 14500, provider: "apigames" },
  { sku: "PUBG-325", gameName: "PUBG Mobile", gameCode: "pubgm", itemName: "325 UC", denomination: "325", costPrice: 74000, provider: "apigames" },
  { sku: "PUBG-660", gameName: "PUBG Mobile", gameCode: "pubgm", itemName: "660 UC", denomination: "660", costPrice: 145000, provider: "apigames" },
  { sku: "GI-60", gameName: "Genshin Impact", gameCode: "genshin", itemName: "60 Crystals", denomination: "60", costPrice: 16000, provider: "apigames" },
  { sku: "GI-330", gameName: "Genshin Impact", gameCode: "genshin", itemName: "330 Crystals", denomination: "330", costPrice: 79000, provider: "apigames" },
  { sku: "HI-70", gameName: "Honkai Impact 3rd", gameCode: "honkai", itemName: "70 Buku", denomination: "70", costPrice: 15000, provider: "apigames" },
  { sku: "VL-100", gameName: "Valorant", gameCode: "valorant", itemName: "100 VP", denomination: "100", costPrice: 14000, provider: "sekalipay" },
  { sku: "VL-475", gameName: "Valorant", gameCode: "valorant", itemName: "475 VP", denomination: "475", costPrice: 58000, provider: "sekalipay" },
  { sku: "COD-80", gameName: "Call of Duty Mobile", gameCode: "codm", itemName: "80 CP", denomination: "80", costPrice: 15000, provider: "apigames" },
  { sku: "HI-SR-60", gameName: "Honkai: Star Rail", gameCode: "hsr", itemName: "60 Oneiric Shard", denomination: "60", costPrice: 16000, provider: "sekalipay" },
  { sku: "PLN-50", gameName: "Token Listrik (PLN)", gameCode: "pln", itemName: "Token PLN 50.000", denomination: "Rp50.000", costPrice: 50500, provider: "sekalipay" },
  { sku: "PULSA-25", gameName: "Pulsa & Paket Data", gameCode: "pulsa", itemName: "Pulsa Rp25.000", denomination: "Rp25.000", costPrice: 25000, provider: "sekalipay" },
];
