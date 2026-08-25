export function formatRupiah(value: number | null | undefined): string {
  const n = Math.round(Number(value ?? 0));
  return "Rp" + n.toLocaleString("id-ID");
}

export function formatRupiahShort(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1) + "Jt";
  if (value >= 1_000) return Math.round(value / 1_000) + "Rb";
  return String(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} hari lalu`;
  return formatDate(d).split(",")[0];
}

export function maskName(name: string): string {
  if (!name) return "Pengguna";
  const clean = name.replace(/[0-9]/g, "").trim() || name;
  if (clean.length <= 2) return clean[0] + "*";
  return clean.slice(0, 2) + clean.slice(2, 4).replace(/./g, "*") + clean.slice(4);
}

export function genInvoice(prefix = "INV"): string {
  const n = Math.floor(Math.random() * 1_000_000_000);
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  return `${prefix}-${ts}${n.toString(36).toUpperCase().padStart(5, "0")}`.slice(0, 22);
}

export function genVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function daysUntilMonthEnd(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, Math.ceil((last.getTime() - now.getTime()) / 86_400_000));
}
