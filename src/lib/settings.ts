import { sql } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_ROULETTE_PRIZES, DEFAULT_CREDIT_PER_RUPIAH, type RoulettePrize } from "./constants";

// Module-level cache so repeated reads within a render cycle stay cheap.
let cache: Record<string, { value: string; ts: number }> = {};
const TTL = 15_000;

async function readRaw(key: string): Promise<string | null> {
  const hit = cache[key];
  const now = Date.now();
  if (hit && now - hit.ts < TTL) return hit.value;
  try {
    const rows = await db.select().from(settings).where(sql`${settings.key} = ${key}`).limit(1);
    const value = rows[0]?.value ?? null;
    cache[key] = { value: value ?? "", ts: now };
    return value;
  } catch {
    return null;
  }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const raw = await readRaw(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

/** Raw (unparsed) value — used for secrets which must never be JSON-interpreted. */
export async function getRawSetting(key: string): Promise<string | null> {
  return readRaw(key);
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  cache[key] = { value: serialized, ts: Date.now() };
  await db
    .insert(settings)
    .values({ key, value: serialized })
    .onConflictDoUpdate({ target: settings.key, set: { value: serialized, updatedAt: new Date() } });
}

export async function getRoulettePrizes(): Promise<RoulettePrize[]> {
  const prizes = await getSetting<RoulettePrize[]>("roulette_prizes", DEFAULT_ROULETTE_PRIZES);
  return prizes.length ? prizes : DEFAULT_ROULETTE_PRIZES;
}

export async function getCreditPerRupiah(): Promise<number> {
  return getSetting<number>("credit_per_rupiah", DEFAULT_CREDIT_PER_RUPIAH);
}
