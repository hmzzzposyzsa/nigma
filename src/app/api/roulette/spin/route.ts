import { rouletteSpins, vouchers } from "@/db/schema";
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
import { db } from "@/db";
import { requireUser } from "@/lib/auth";
import { spendCredits, weightedPick, adjustWallet, grantCredits } from "@/lib/ledger";
import { getRoulettePrizes } from "@/lib/settings";
import { genVoucherCode } from "@/lib/format";

export async function POST() {
  const user = await requireUser();

  const ok = await spendCredits(user.id, 1, "spent_roulette", "Spin Event Roulette", "roulette");
  if (!ok) {
    return Response.json({ error: "Spin Credit tidak cukup. Lakukan transaksi untuk mendapat kredit." }, { status: 402 });
  }

  // Server-side prize determination BEFORE any animation.
  const prizes = await getRoulettePrizes();
  const winner = weightedPick(prizes);

  await db.insert(rouletteSpins).values({
    userId: user.id,
    segment: winner.segment,
    prizeType: winner.type,
    prizeLabel: winner.label,
    prizeValue: winner.value,
  });

  let voucherCode: string | null = null;
  if (winner.type === "cashback" && winner.value > 0) {
    await adjustWallet(user.id, winner.value, "cashback", `Cashback Event Roulette`, "roulette");
  } else if (winner.type === "credit" && winner.value > 0) {
    await grantCredits(user.id, winner.value, "event_reward", `Bonus kredit Event Roulette`, "roulette");
  } else if (winner.type === "voucher_pct") {
    voucherCode = genVoucherCode();
    await db.insert(vouchers).values({
      userId: user.id,
      code: voucherCode,
      discountType: "percentage",
      discountValue: winner.value,
      maxDiscount: winner.maxDiscount ?? 0,
      source: "roulette",
      expiresAt: addDays(new Date(), 30),
    });
  }

  return Response.json({
    segment: winner.segment,
    prize: { type: winner.type, label: winner.label, value: winner.value, voucherCode, color: winner.color },
  });
}
