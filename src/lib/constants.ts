// Domain constants for the membership tiers, credit rules, and admin-tunable defaults.

export const TIERS = {
  pemula: { label: "Pemula", margin: 0.05, upgradeThreshold: 0, retention: 0, welcomeCredits: 0 },
  langganan: { label: "Langganan", margin: 0.03, upgradeThreshold: 150000, retention: 25000, welcomeCredits: 3 },
  sultan: { label: "Sultan", margin: 0.015, upgradeThreshold: 500000, retention: 50000, welcomeCredits: 6 },
} as const;

/** Max spin credits earnable in a single transaction — same for all roles. */
export const MAX_CREDITS_PER_TX = 5;

export type TierKey = keyof typeof TIERS;
export const TIER_ORDER: TierKey[] = ["pemula", "langganan", "sultan"];

/** Spin-credit earning rate, configurable via admin panel. */
export const DEFAULT_CREDIT_PER_RUPIAH = 5000; // 1 credit per Rp5.000 of successful spend
export const CREDIT_MIN_TRANSACTION = 5000;

/** Default prize wheel segments (probabilities sum to 1). Admin-tunable. */
export type RoulettePrize = {
  segment: number;
  label: string;
  type: "cashback" | "voucher_pct" | "credit" | "none";
  value: number; // cashback rupiah, voucher percent, or credit count
  maxDiscount?: number;
  probability: number;
  color: string;
};

export const DEFAULT_ROULETTE_PRIZES: RoulettePrize[] = [
  { segment: 1, label: "Cashback Rp500", type: "cashback", value: 500, probability: 0.3, color: "#2563EB" },
  { segment: 2, label: "Diskon 2%", type: "voucher_pct", value: 2, maxDiscount: 1000, probability: 0.2, color: "#06B6D4" },
  { segment: 3, label: "Cashback Rp1.000", type: "cashback", value: 1000, probability: 0.15, color: "#8B5CF6" },
  { segment: 4, label: "+1 Spin Credit", type: "credit", value: 1, probability: 0.15, color: "#0EA5E9" },
  { segment: 5, label: "Diskon 5%", type: "voucher_pct", value: 5, maxDiscount: 2000, probability: 0.1, color: "#6366F1" },
  { segment: 6, label: "Cashback Rp2.500", type: "cashback", value: 2500, probability: 0.06, color: "#7C3AED" },
  { segment: 7, label: "Coba lagi", type: "none", value: 0, probability: 0.02, color: "#475569" },
  { segment: 8, label: "JACKPOT Diskon 10%", type: "voucher_pct", value: 10, maxDiscount: 10000, probability: 0.02, color: "#F59E0B" },
];

export const PAYMENT_METHODS = [
  { id: "qris", label: "QRIS", group: "e-wallet", hint: "Scan dengan aplikasi e-wallet", icon: "/payment-icons/qris.svg" },
  { id: "gopay", label: "GoPay", group: "e-wallet", hint: "Bayar dengan GoPay", icon: "/payment-icons/gopay.svg" },
  { id: "shopeepay", label: "ShopeePay", group: "e-wallet", hint: "Bayar dengan ShopeePay", icon: "/payment-icons/shopeepay.svg" },
  { id: "dana", label: "DANA", group: "e-wallet", hint: "Bayar dengan DANA", icon: "/payment-icons/dana.svg" },
  { id: "ovo", label: "OVO", group: "e-wallet", hint: "Bayar dengan OVO", icon: "/payment-icons/ovo.svg" },
  { id: "bca_va", label: "BCA Virtual Account", group: "va", hint: "Transfer ke nomor VA BCA", icon: "/payment-icons/bca.svg" },
  { id: "bni_va", label: "BNI Virtual Account", group: "va", hint: "Transfer ke nomor VA BNI", icon: "/payment-icons/bni.svg" },
  { id: "mandiri_va", label: "Mandiri Virtual Account", group: "va", hint: "Transfer ke nomor VA Mandiri", icon: "/payment-icons/mandiri.svg" },
  { id: "alfamart", label: "Alfamart", group: "retail", hint: "Bayar di gerai Alfamart", icon: "/payment-icons/alfamart.svg" },
  { id: "indomaret", label: "Indomaret", group: "retail", hint: "Bayar di gerai Indomaret", icon: "/payment-icons/indomaret.svg" },
] as const;

export const EVENT_CONCEPTS: { type: string; title: string; desc: string }[] = [
  { type: "mystery_box", title: "Mystery Box Tier Draw", desc: "Buka Mystery Box dengan kredit. Langganan = Silver, Sultan = Gold." },
  { type: "leaderboard", title: "Weekly Leaderboard", desc: "Peringkat pengeluaran mingguan, top 3–10 menang voucher." },
  { type: "community_goal", title: "Community Goal", desc: "Target belanja komunitas tercapai = semua eligible dapat reward." },
  { type: "quiz", title: "Guess & Win Quiz", desc: "1 kredit per tebakan, benar menang voucher, salah dapat consolation." },
  { type: "login_streak", title: "Login Streak Bonus", desc: "Check-in harian gratis, bonus di hari ke-7/14/30." },
  { type: "referral", title: "Referral Boost", desc: "Referrer & teman dapat bonus saat teman top-up pertama." },
  { type: "auction", title: "Flash Auction", desc: "Lelang kredit mingguan, satu pemenang, biaya tetap." },
  { type: "stamp_card", title: "Stamp Card Quest", desc: "Kumpulkan stempel per transaksi, Sultan 2x lebih cepat." },
];

export const SITE = {
  name: "NexusTop",
  tagline: "Top-Up Game Tercepat & Terpercaya",
  supportEmail: "support@nexustop.id",
  whatsapp: "6281234567890",
  instagram: "https://instagram.com",
  twitter: "https://twitter.com",
  tiktok: "https://tiktok.com",
  facebook: "https://facebook.com",
  discord: "https://discord.com",
  youtube: "https://youtube.com",
};
