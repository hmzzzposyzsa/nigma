import { TIERS, MAX_CREDITS_PER_TX, type TierKey } from "./constants";
import type { User } from "@/db/schema";

export const ROLE_RANK: Record<TierKey, number> = { pemula: 0, langganan: 1, sultan: 2 };

export function roleFromSpend(monthlySpend: number): TierKey {
  if (monthlySpend >= TIERS.sultan.upgradeThreshold) return "sultan";
  if (monthlySpend >= TIERS.langganan.upgradeThreshold) return "langganan";
  return "pemula";
}

export function tierRank(role: string): number {
  return ROLE_RANK[role as TierKey] ?? 0;
}

export function marginFor(role: string): number {
  return TIERS[role as TierKey]?.margin ?? TIERS.pemula.margin;
}

/** Max spin credits earnable in a single transaction — same for all roles. */
export function maxCreditsFor(_role: string): number {
  return MAX_CREDITS_PER_TX;
}

/**
 * The DISCOUNT a tier gets relative to the standard (Pemula) price.
 * Pemula uses the full markup = "Harga Normal" (the baseline). Higher tiers pay
 * a smaller markup, so their effective discount vs. Pemula is the difference.
 *   Langganan: 5% − 3%   = 2% discount
 *   Sultan:     5% − 1.5% = 3.5% discount
 * Returns a percentage number (e.g. 2, 3.5, or 0 for Pemula).
 */
export function tierDiscount(role: string): number {
  const r = (role as TierKey) ?? "pemula";
  return Math.round((TIERS.pemula.margin - (TIERS[r]?.margin ?? TIERS.pemula.margin)) * 1000) / 10;
}

/** Human label: "Harga Normal" for Pemula, "Diskon 2%" / "Diskon 3.5%" otherwise. */
export function tierDiscountLabel(role: string): string {
  const d = tierDiscount(role);
  if (d <= 0) return "Harga Normal";
  const text = Number.isInteger(d) ? String(d) : d.toFixed(1).replace(".0", "");
  return `Diskon ${text}%`;
}

/** sell_price = cost_price * (1 + margin%). Rounded to the nearest rupiah. */
export function sellPrice(costPrice: number, role: string): number {
  return Math.round(costPrice * (1 + marginFor(role)));
}

export function nextTier(role: string): TierKey | null {
  const r = role as TierKey;
  if (r === "pemula") return "langganan";
  if (r === "langganan") return "sultan";
  return null;
}

/**
 * Determine whether a fresh spend total should upgrade the user this cycle and
 * how many welcome credits the upgrade grants (cumulative so Sultan always
 * totals 6 and Langganan totals 3).
 */
export function evaluateUpgrade(
  currentRole: string,
  monthlySpend: number
): { upgraded: boolean; newRole: TierKey; bonusCredits: number } {
  const earned = roleFromSpend(monthlySpend);
  const currentRank = tierRank(currentRole);
  const earnedRank = tierRank(earned);
  if (earnedRank > currentRank) {
    let bonus = 0;
    // Credits granted for the tiers the user newly crossed.
    if (earnedRank >= 1 && currentRank < 1) bonus += TIERS.langganan.welcomeCredits;
    if (earnedRank >= 2 && currentRank < 2) bonus += TIERS.sultan.welcomeCredits - TIERS.langganan.welcomeCredits;
    return { upgraded: true, newRole: earned, bonusCredits: bonus };
  }
  return { upgraded: false, newRole: currentRole as TierKey, bonusCredits: 0 };
}

/** How much more the user must spend before month-end to retain their tier. */
export function retentionShortfall(role: string, monthlySpend: number): number {
  const tier = TIERS[role as TierKey];
  if (!tier || (role !== "langganan" && role !== "sultan")) return 0;
  return Math.max(0, tier.retention - monthlySpend);
}

export function tierBadgeColor(role: string): string {
  if (role === "sultan") return "gold";
  if (role === "langganan") return "violet";
  return "muted";
}

export type TierProgress = {
  role: TierKey;
  nextRole: TierKey | null;
  progress: number; // 0..1 toward next upgrade
  remaining: number; // rupiah still needed for next upgrade
  spend: number;
  target: number;
};

export function tierProgress(user: Pick<User, "role" | "monthlySpend">): TierProgress {
  const role = user.role as TierKey;
  const next = nextTier(role);
  if (!next) {
    return { role, nextRole: null, progress: 1, remaining: 0, spend: user.monthlySpend, target: TIERS.sultan.upgradeThreshold };
  }
  const target = TIERS[next].upgradeThreshold;
  const base = role === "pemula" ? 0 : TIERS[role].upgradeThreshold;
  const span = target - base;
  const progress = Math.min(1, Math.max(0, (user.monthlySpend - base) / span));
  return { role, nextRole: next, progress, remaining: Math.max(0, target - user.monthlySpend), spend: user.monthlySpend, target };
}
