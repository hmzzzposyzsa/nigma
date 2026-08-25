import { eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { TIERS, type TierKey } from "./constants";
import { retentionShortfall } from "./tiers";
import { daysUntilMonthEnd, formatRupiah } from "./format";
import { addNotification } from "./ledger";
import { sendEmail, sendWhatsapp } from "./integrations";

function dropOne(role: TierKey): TierKey {
  if (role === "sultan") return "langganan";
  if (role === "langganan") return "pemula";
  return "pemula";
}

/**
 * Month-end cycle. For every user:
 *  1. snapshot their held role into lastMonthRole,
 *  2. apply retention check (keep tier if monthly spend >= retention, else drop ONE tier),
 *  3. reset monthlySpend to 0 for the new month.
 * Intended to run via a Supabase cron / Edge Function at month boundaries.
 */
export async function runMonthlyTierCycle() {
  const all = await db.select().from(users);
  let retained = 0;
  let dropped = 0;
  for (const u of all) {
    const role = u.role as TierKey;
    const held = role;
    let next: TierKey = role;
    if (role === "langganan" || role === "sultan") {
      const need = TIERS[role].retention;
      if (u.monthlySpend >= need) {
        retained++;
      } else {
        next = dropOne(role);
        dropped++;
      }
    }
    await db
      .update(users)
      .set({ lastMonthRole: held, role: next, monthlySpend: 0 })
      .where(eq(users.id, u.id));
  }
  return { processed: all.length, retained, dropped };
}

/** Send retention reminders to tiered users currently below their retention target. */
export async function sendRetentionReminders() {
  const tiered = await db.select().from(users).where(or(eq(users.role, "langganan"), eq(users.role, "sultan")));
  const days = daysUntilMonthEnd();
  let sent = 0;
  for (const u of tiered) {
    const shortfall = retentionShortfall(u.role, u.monthlySpend);
    if (shortfall <= 0) continue;
    const msg = `NexusTop: Tier ${TIERS[u.role as TierKey].label} Anda berisiko turun bulan depan. Belanja ${formatRupiah(shortfall)} lagi dalam ${days} hari untuk mempertahankannya.`;
    const tasks: Promise<unknown>[] = [addNotification(u.id, "Pengingat Tier", msg, "warning")];
    if (u.email) tasks.push(sendEmail({ to: u.email, subject: "Pengingat Retensi Tier NexusTop", html: `<p>${msg}</p>` }));
    if (u.phone) tasks.push(sendWhatsapp({ to: u.phone, message: msg }));
    await Promise.allSettled(tasks);
    sent++;
  }
  return { sent, days };
}

// keep import used (inArray reserved for future bulk ops)
void inArray;
void sql;
