import { z } from "zod";
import { db } from "@/db";
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
import { vouchers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { spendCredits, grantCredits, adjustWallet } from "@/lib/ledger";
import { genVoucherCode } from "@/lib/format";

const schema = z.object({
  creditCost: z.number().int().min(1).default(2),
  silver: z.array(z.string()).default([]),
  gold: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Konfigurasi event tidak valid." }, { status: 400 });

  // Server decides the pool based on the user's real tier (anti-cheat).
  const pool = user.role === "sultan" && parsed.data.gold.length ? parsed.data.gold : parsed.data.silver;
  if (!pool.length) return Response.json({ error: "Hadiah belum tersedia." }, { status: 400 });

  const ok = await spendCredits(user.id, parsed.data.creditCost, "spent_event", "Mystery Box", "mystery");
  if (!ok) return Response.json({ error: "Spin Credit tidak cukup." }, { status: 402 });

  const prize = pool[Math.floor(Math.random() * pool.length)];
  let effect = "reward";
  const creditMatch = prize.match(/(\d+)\s*Credit/i);
  const cashMatch = prize.match(/Rp\s*([\d.]+)/i);
  const pctMatch = prize.match(/(\d+)%/);

  if (creditMatch) {
    await grantCredits(user.id, parseInt(creditMatch[1], 10), "event_reward", `Mystery Box: ${prize}`, "mystery");
    effect = "credit";
  } else if (cashMatch) {
    const amt = parseInt(cashMatch[1].replace(/\./g, ""), 10);
    await adjustWallet(user.id, amt, "cashback", `Mystery Box: ${prize}`, "mystery");
    effect = "cashback";
  } else if (pctMatch) {
    const code = genVoucherCode();
    await db.insert(vouchers).values({
      userId: user.id,
      code,
      discountType: "percentage",
      discountValue: parseInt(pctMatch[1], 10),
      maxDiscount: 5000,
      source: "mystery",
      expiresAt: addDays(new Date(), 30),
    });
    return Response.json({ prize, effect: "voucher", voucherCode: code });
  }
  return Response.json({ prize, effect });
}
