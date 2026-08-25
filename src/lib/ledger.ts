import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  creditTransactions,
  walletTransactions,
  notifications,
  type User,
} from "@/db/schema";
import { creditType, walletType } from "@/db/schema";
import { evaluateUpgrade, maxCreditsFor } from "./tiers";
import { getCreditPerRupiah } from "./settings";
import { CREDIT_MIN_TRANSACTION } from "./constants";

type Client = typeof db;

export async function grantCredits(
  userId: string,
  delta: number,
  type: (typeof creditType.enumValues)[number],
  description?: string,
  reference?: string,
  client: Client = db
) {
  if (delta === 0) return;
  await client
    .update(users)
    .set({ creditBalance: sql`${users.creditBalance} + ${delta}` })
    .where(eq(users.id, userId));
  await client.insert(creditTransactions).values({ userId, delta, type, description, reference });
}

export async function spendCredits(
  userId: string,
  amount: number,
  type: (typeof creditType.enumValues)[number],
  description?: string,
  reference?: string
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(users).where(eq(users.id, userId)).limit(1).for("update");
    const u = rows[0];
    if (!u || u.creditBalance < amount) return false;
    await tx.update(users).set({ creditBalance: u.creditBalance - amount }).where(eq(users.id, userId));
    await tx.insert(creditTransactions).values({ userId, delta: -amount, type, description, reference });
    return true;
  });
}

export async function adjustWallet(
  userId: string,
  delta: number,
  type: (typeof walletType.enumValues)[number],
  description?: string,
  reference?: string,
  client: Client = db
) {
  if (delta === 0) return;
  await client
    .update(users)
    .set({ balance: sql`${users.balance} + ${delta}` })
    .where(eq(users.id, userId));
  await client.insert(walletTransactions).values({ userId, delta, type, description, reference });
}

export async function deductWallet(
  userId: string,
  amount: number,
  type: (typeof walletType.enumValues)[number],
  description?: string,
  reference?: string
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(users).where(eq(users.id, userId)).limit(1).for("update");
    const u = rows[0];
    if (!u || u.balance < amount) return false;
    await tx.update(users).set({ balance: u.balance - amount }).where(eq(users.id, userId));
    await tx.insert(walletTransactions).values({ userId, delta: -amount, type, description, reference });
    return true;
  });
}

export async function addNotification(
  userId: string,
  title: string,
  body?: string,
  kind = "info",
  client: Client = db
) {
  await client.insert(notifications).values({ userId, title, body, kind });
}

export async function unreadNotifications(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return rows[0]?.count ?? 0;
}

/**
 * Called once an order/deposit is fully successful. Records revenue, awards spin
 * credits, and applies the live membership-tier upgrade (with welcome bonus).
 * Runs atomically.
 */
export async function recordSuccessfulSpend(userId: string, amount: number, reference: string) {
  if (amount <= 0) return;
  const creditPerRupiah = await getCreditPerRupiah();

  await db.transaction(async (tx) => {
    const rows = await tx.select().from(users).where(eq(users.id, userId)).limit(1).for("update");
    const u = rows[0];
    if (!u) return;

    // Credits earned from this transaction, capped by the user's tier
    // (Pemula max 5 per transaction; Langganan/Sultan uncapped).
    const rawCredits = amount >= CREDIT_MIN_TRANSACTION ? Math.floor(amount / creditPerRupiah) : 0;
    const credits = Math.min(rawCredits, maxCreditsFor(u.role));

    const newMonthly = u.monthlySpend + amount;
    const newTotal = u.totalSpend + amount;
    const patch: Partial<User> = { monthlySpend: newMonthly, totalSpend: newTotal };

    const evalResult = evaluateUpgrade(u.role, newMonthly);
    if (evalResult.upgraded) {
      patch.role = evalResult.newRole;
    }
    await tx.update(users).set(patch).where(eq(users.id, userId));

    if (credits > 0) {
      await tx
        .update(users)
        .set({ creditBalance: sql`${users.creditBalance} + ${credits}` })
        .where(eq(users.id, userId));
      await tx.insert(creditTransactions).values({
        userId,
        delta: credits,
        type: "earned_purchase",
        description: `Kredit dari transaksi ${reference}`,
        reference,
      });
    }

    if (evalResult.upgraded && evalResult.bonusCredits > 0) {
      await tx
        .update(users)
        .set({ creditBalance: sql`${users.creditBalance} + ${evalResult.bonusCredits}` })
        .where(eq(users.id, userId));
      await tx.insert(creditTransactions).values({
        userId,
        delta: evalResult.bonusCredits,
        type: "welcome_bonus",
        description: `Bonus selamat datang tier ${evalResult.newRole}`,
        reference,
      });
      await tx.insert(notifications).values({
        userId,
        title: `Selamat! Anda naik ke tier ${evalResult.newRole}`,
        body: `Anda mendapatkan ${evalResult.bonusCredits} Spin Credit bonus. Nikmati margin lebih rendah dan akses event eksklusif.`,
        kind: "success",
      });
    }
  });
}

/** Select roulette winner server-side from weighted probabilities. */
export function weightedPick<T extends { probability: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.probability, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.probability;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// re-export for convenience in route handlers
export { and, eq, gte, lte, sql };
