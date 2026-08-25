"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Ticket,
  Sparkles,
  Wallet,
  Check,
  ArrowRight,
  Copy,
  QrCode,
} from "lucide-react";
import { Button, Input, Label, Badge, Card, cn, Select } from "./ui";
import { Modal } from "./Modal";
import { formatRupiah } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { SaleInfo } from "@/lib/queries";

function salePriceOf(sell: number, sale?: SaleInfo) {
  if (!sale) return sell;
  return sale.discountType === "percentage" ? Math.round(sell * (1 - sale.discountValue / 100)) : Math.max(0, sell - sale.discountValue);
}

type Product = { id: string; itemName: string; denomination: string | null; costPrice: number; sellPrice: number; sku: string | null };

export function PurchaseFlow({
  game,
  products,
  salesMap,
  role,
  balance,
  creditPerRupiah,
  initialProductId,
  contactPrefill,
}: {
  game: {
    id: string;
    name: string;
    needsServerId: boolean;
    idFieldLabel: string;
    serverFieldLabel: string;
    idPlaceholder: string;
    gameCode?: string;
  };
  products: Product[];
  salesMap: Record<string, SaleInfo>;
  role: string;
  balance: number | null;
  creditPerRupiah: number;
  initialProductId?: string;
  contactPrefill?: string;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(initialProductId && products.some((p) => p.id === initialProductId) ? initialProductId : products[0]?.id ?? "");
  const [gameUserId, setGameUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [contact, setContact] = useState(contactPrefill ?? "");
  const [voucherCode, setVoucherCode] = useState("");
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0].id);
  const [useBalance, setUseBalance] = useState(false);
  const [valid, setValid] = useState<{ state: "idle" | "checking" | "ok" | "fail"; msg?: string; nick?: string }>({ state: "idle" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ order: any; instructions: any } | null>(null);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const sale = product ? salesMap[product.id] : undefined;
  const total = product ? salePriceOf(product.sellPrice, sale) : 0;
  const rawCredits = total >= 5000 ? Math.floor(total / creditPerRupiah) : 0;
  // Capped at MAX_CREDITS_PER_TX for all roles.
  const creditsEarn = Math.min(rawCredits, 5);

  async function checkId() {
    if (!gameUserId.trim()) return setValid({ state: "fail", msg: "Masukkan ID terlebih dahulu." });
    setValid({ state: "checking" });
    try {
      const res = await fetch("/api/validate-game-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameCode: game.gameCode, gameSlug: game.name, userId: gameUserId, serverId }),
      });
      const data = await res.json();
      if (data.valid) setValid({ state: "ok", msg: data.message, nick: data.nickname });
      else setValid({ state: "fail", msg: data.message || "ID tidak valid." });
    } catch {
      setValid({ state: "fail", msg: "Gagal memverifikasi. Coba lagi." });
    }
  }

  async function checkout() {
    setError("");
    if (!product) return setError("Pilih nominal terlebih dahulu.");
    if (valid.state !== "ok") return setError("Verifikasi ID Game kamu terlebih dahulu.");
    if (game.needsServerId && !serverId.trim()) return setError(`Isi ${game.serverFieldLabel} kamu.`);
    if (!contact.trim()) return setError("Isi email atau nomor HP untuk resi.");
    if (useBalance && balance != null && balance < total) return setError("Saldo dompet tidak cukup.");
    if (!useBalance && !method) return setError("Pilih metode pembayaran.");

    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          productId: product.id,
          gameUserId,
          serverId: serverId || undefined,
          contact,
          paymentMethod: useBalance ? "balance" : method,
          useBalance,
          voucherCode: voucherCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Gagal membuat pesanan.");
      setResult({ order: data.order, instructions: data.instructions });
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* Step 1: nominal */}
        <Card className="p-5">
          <StepHeader n={1} title="Pilih Nominal" />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {products.map((p) => {
              const s = salesMap[p.id];
              const price = salePriceOf(p.sellPrice, s);
              const active = p.id === productId;
              return (
                <button
                  key={p.id}
                  onClick={() => setProductId(p.id)}
                  className={cn(
                    "relative flex flex-col items-start rounded-xl border p-3 text-left transition",
                    active ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  {s && (
                    <span className="absolute right-1.5 top-1.5 rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {s.discountType === "percentage" ? `-${s.discountValue}%` : "SALE"}
                    </span>
                  )}
                  <span className="text-sm font-bold leading-tight">{p.itemName}</span>
                  {p.denomination && <span className="text-xs text-muted-foreground">{p.denomination}</span>}
                  <span className="mt-1.5 text-sm font-bold text-primary">{formatRupiah(price)}</span>
                  {s && <span className="text-[11px] text-muted-foreground line-through">{formatRupiah(p.sellPrice)}</span>}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Step 2: account data */}
        <Card className="p-5">
          <StepHeader n={2} title="Data Akun Game" />
          <div className="space-y-3">
            <div>
              <Label>{game.idFieldLabel}</Label>
              <div className="flex gap-2">
                <Input value={gameUserId} onChange={(e) => { setGameUserId(e.target.value); setValid({ state: "idle" }); }} placeholder={game.idPlaceholder} />
                <Button type="button" variant="outline" onClick={checkId} disabled={valid.state === "checking"} className="shrink-0">
                  {valid.state === "checking" ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Cek
                </Button>
              </div>
            </div>
            {game.needsServerId && (
              <div>
                <Label>{game.serverFieldLabel}</Label>
                <Input value={serverId} onChange={(e) => setServerId(e.target.value)} placeholder={`Masukkan ${game.serverFieldLabel}`} />
              </div>
            )}
            {valid.state === "ok" && (
              <p className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
                <ShieldCheck size={15} /> {valid.msg}
              </p>
            )}
            {valid.state === "fail" && (
              <p className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                <ShieldAlert size={15} /> {valid.msg}
              </p>
            )}
          </div>
        </Card>

        {/* Step 3: contact */}
        <Card className="p-5">
          <StepHeader n={3} title="Email / No. HP (untuk Resi)" />
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="email@kamu.com atau 0812xxxx" />
          <p className="mt-1.5 text-xs text-muted-foreground">Resi & notifikasi status pesanan akan dikirim ke kontak ini.</p>
        </Card>

        {/* Step 4: payment */}
        <Card className="p-5">
          <StepHeader n={4} title="Metode Pembayaran" />
          {balance != null && (
            <button
              onClick={() => setUseBalance(true)}
              className={cn(
                "mb-3 flex w-full items-center justify-between rounded-xl border p-3 text-left transition",
                useBalance ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <span className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent"><Wallet size={18} /></span>
                <span>
                  <span className="block text-sm font-bold">Saldo Dompet</span>
                  <span className="block text-xs text-muted-foreground">Saldo: {formatRupiah(balance)}</span>
                </span>
              </span>
              {useBalance && <Check size={18} className="text-primary" />}
            </button>
          )}
          {balance == null && (
            <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              <a href="/register" className="font-semibold text-primary">Daftar</a> & deposit saldo untuk membayar lebih cepat dengan dompet.
            </p>
          )}
          <div className={cn("transition", useBalance && "pointer-events-none opacity-40")}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pembayaran Langsung</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); setUseBalance(false); }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition",
                    method === m.id && !useBalance ? "border-primary bg-primary/5 ring-1 ring-primary/40" : "border-border hover:border-primary/40"
                  )}
                >
                  <span className="grid h-7 w-full place-items-center rounded bg-white px-2 py-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.icon} alt={m.label} className="h-5 max-w-[70px] object-contain" />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Summary */}
      <div>
        <Card className="sticky top-20 p-5">
          <h3 className="text-base font-bold">Ringkasan Pesanan</h3>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Game" value={game.name} />
            <Row label="Item" value={product ? `${product.itemName}${product.denomination ? ` · ${product.denomination}` : ""}` : "-"} />
            {sale && <Row label="Flash Sale" value={`-${sale.discountType === "percentage" ? sale.discountValue + "%" : formatRupiah(sale.discountValue)}`} tone="danger" />}
            <Row label="Harga" value={formatRupiah(total)} bold />
          </div>

          <div className="mt-3 flex gap-2">
            <Input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder="Kode voucher" className="h-10" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Voucher dari roulette bisa dipakai di sini.</p>

          {creditsEarn > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              <Sparkles size={14} /> Kamu akan dapat +{creditsEarn} Spin Credit
            </div>
          )}

          {error && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

          <Button onClick={checkout} size="lg" className="mt-4 w-full" disabled={busy}>
            {busy ? "Memproses..." : "Beli Sekarang"} <ArrowRight size={16} />
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Dengan melanjutkan, kamu menyetujui <a href="/terms" className="underline">Syarat & Ketentuan</a>.
          </p>
        </Card>
      </div>

      {/* Payment instructions modal */}
      <Modal open={!!result} onClose={() => result && router.push(`/orders/${result.order.id}`)} title={result?.instructions ? "Selesaikan Pembayaran" : "Pesanan Dibuat"}>
        {result && (
          <div className="p-5">
            {result.instructions ? (
              <PaymentInstructions order={result.order} instructions={result.instructions} />
            ) : (
              <p className="text-sm text-muted-foreground">Pesanan sedang diproses dengan saldo dompetmu. Mengarahkan ke halaman status...</p>
            )}
            <Button onClick={() => router.push(`/orders/${result.order.id}`)} size="lg" className="mt-4 w-full">
              {result.instructions ? "Saya Sudah Bayar — Cek Status" : "Lihat Status Pesanan"} <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PaymentInstructions({ order, instructions }: { order: any; instructions: any }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-muted p-3 text-center">
        <p className="text-xs text-muted-foreground">Total Pembayaran</p>
        <p className="text-2xl font-bold text-primary">{formatRupiah(order.amount)}</p>
        <p className="text-xs text-muted-foreground">Invoice: {order.invoiceNo}</p>
      </div>
      {instructions.qrString && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-4">
          <span className="grid h-40 w-40 place-items-center rounded-xl bg-white">
            <QrCode size={120} className="text-black" />
          </span>
          <p className="text-xs text-muted-foreground">Scan QRIS dengan aplikasi e-wallet/banking-mu.</p>
        </div>
      )}
      {instructions.vaNumber && (
        <CopyRow label={`Nomor VA ${instructions.vaBank ?? ""}`} value={instructions.vaNumber} />
      )}
      {instructions.deeplinkUrl && (
        <div className="rounded-xl border border-border p-3 text-sm">
          <p className="text-xs text-muted-foreground">Bayar via deep-link:</p>
          <p className="truncate font-mono text-xs">{instructions.deeplinkUrl}</p>
        </div>
      )}
      {!instructions.qrString && !instructions.vaNumber && !instructions.deeplinkUrl && (
        <p className="text-sm text-muted-foreground">Selesaikan pembayaran sesuai instruksi metode yang dipilih, lalu klik tombol di bawah untuk memverifikasi status.</p>
      )}
      <p className="text-center text-[11px] text-muted-foreground">Pembayaran terverifikasi otomatis. Lalu item dikirim ke ID Game-mu.</p>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-base font-bold tracking-wide">{value}</p>
      </div>
      <button
        onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="grid h-9 w-9 place-items-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground"
        aria-label="Salin"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</span>
      <h3 className="text-base font-bold">{title}</h3>
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "danger" }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", bold && "text-base", tone === "danger" && "text-danger")}>{value}</span>
    </div>
  );
}
