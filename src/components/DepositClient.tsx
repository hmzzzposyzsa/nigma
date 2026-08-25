"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Sparkles, ArrowDownToLine, Copy, Check, Loader2, RefreshCw, QrCode, History } from "lucide-react";
import { Button, Input, Card, Badge, cn } from "./ui";
import { Modal } from "./Modal";
import { formatRupiah, formatDate } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";

const QUICK = [10000, 25000, 50000, 100000, 200000, 500000];

export function DepositClient({
  balance,
  name,
  recentDeposits,
  walletTx,
}: {
  balance: number;
  name: string;
  recentDeposits: { id: string; invoiceNo: string; amount: number; status: string; method: string; createdAt: string }[];
  walletTx: { id: string; type: string; delta: number; description: string | null; createdAt: string }[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(50000);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ deposit: any; instructions: any; success?: boolean } | null>(null);
  const [checking, setChecking] = useState(false);

  const finalAmount = custom ? Math.max(10000, parseInt(custom.replace(/\D/g, "") || "0", 10)) : amount;

  async function deposit() {
    setError("");
    if (finalAmount < 10000) return setError("Minimal deposit Rp10.000.");
    setBusy(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Gagal membuat deposit.");
      setResult({ deposit: data.deposit, instructions: data.instructions });
    } catch {
      setError("Koneksi bermasalah.");
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus() {
    if (!result) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/deposits/${result.deposit.id}/check`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.deposit) {
        setResult({ ...result, deposit: data.deposit, success: data.deposit.status === "success" });
        if (data.deposit.status === "success") {
          router.refresh();
        }
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_320px]">
        {/* Balance card */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-primary p-6 text-white">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 hidden" />
          <p className="text-sm text-white/80">Saldo Dompet · {name}</p>
          <p className="mt-1 text-4xl font-bold">{formatRupiah(balance)}</p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs">
            <Sparkles size={14} /> Setiap deposit sukses juga memberi Spin Credit untuk Event Roulette.
          </div>
        </div>

        {/* Deposit form */}
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <ArrowDownToLine size={18} className="text-primary" /> Deposit Saldo
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {QUICK.map((v) => (
              <button
                key={v}
                onClick={() => { setAmount(v); setCustom(""); }}
                className={cn("rounded-lg border py-2 text-xs font-bold transition", !custom && amount === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40")}
              >
                {formatRupiah(v)}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Atau jumlah lain (min 10rb)" inputMode="numeric" />
          </div>
          <p className="mt-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metode Pembayaran</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.slice(0, 6).map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn("flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition", method === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40")}
              >
                <span className="grid h-7 w-full place-items-center rounded bg-white px-2 py-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.icon} alt={m.label} className="h-5 max-w-[64px] object-contain" />
                </span>
                <span className="text-[11px] font-semibold leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
          {error && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
          <Button onClick={deposit} size="lg" className="mt-4 w-full" disabled={busy}>
            {busy ? "Memproses..." : `Deposit ${formatRupiah(finalAmount)}`}
          </Button>
        </Card>
      </div>

      {/* History */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
            <History size={16} /> Riwayat Deposit
          </h3>
          {recentDeposits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada deposit.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentDeposits.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{formatRupiah(d.amount)}</p>
                    <p className="text-xs text-muted-foreground">{d.method} · {formatDate(d.createdAt)}</p>
                  </div>
                  <Badge tone={d.status === "success" ? "success" : d.status === "failed" ? "danger" : "muted"}>{d.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
            <Wallet size={16} /> Mutasi Dompet
          </h3>
          {walletTx.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
          ) : (
            <ul className="divide-y divide-border">
              {walletTx.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-semibold capitalize">{t.description ?? t.type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                  </div>
                  <span className={cn("text-sm font-bold", t.delta >= 0 ? "text-success" : "text-danger")}>
                    {t.delta >= 0 ? "+" : ""}{formatRupiah(t.delta)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={!!result} onClose={() => { setResult(null); router.refresh(); }} title={result?.success ? "Deposit Berhasil" : "Selesaikan Pembayaran"}>
        {result && (
          <div className="p-5">
            {result.success ? (
              <div className="py-4 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success"><Check size={30} /></div>
                <p className="mt-3 text-lg font-bold">Saldo Bertambah!</p>
                <p className="text-sm text-muted-foreground">{formatRupiah(result.deposit.amount)} telah masuk ke dompetmu.</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-muted p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-primary">{formatRupiah(result.deposit.amount)}</p>
                  <p className="text-xs text-muted-foreground">{result.deposit.invoiceNo}</p>
                </div>
                {result.instructions?.qrString && (
                  <div className="my-3 flex flex-col items-center gap-1 rounded-xl border border-border p-4">
                    <span className="grid h-36 w-36 place-items-center rounded-xl bg-white"><QrCode size={104} className="text-black" /></span>
                    <p className="text-xs text-muted-foreground">Scan QRIS untuk membayar.</p>
                  </div>
                )}
                {result.instructions?.vaNumber && <CopyRow label={`Nomor VA ${result.instructions.vaBank ?? ""}`} value={result.instructions.vaNumber} />}
                {result.instructions?.deeplinkUrl && (
                  <p className="mt-2 truncate rounded-xl border border-border p-2 font-mono text-xs">{result.instructions.deeplinkUrl}</p>
                )}
              </>
            )}
            <Button onClick={checkStatus} size="lg" className="mt-4 w-full" disabled={checking || result.success}>
              {checking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} {result.success ? "Diverifikasi" : "Saya Sudah Bayar"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-base font-bold">{value}</p>
      </div>
      <button onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="grid h-9 w-9 place-items-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground" aria-label="Salin">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}
