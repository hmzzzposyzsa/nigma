"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  CreditCard,
  PackageCheck,
  ArrowRight,
  Receipt,
} from "lucide-react";
import { Container, Button, Input, Card, Badge, cn } from "@/components/ui";
import { formatRupiah, formatDate } from "@/lib/format";

type TrackedOrder = {
  invoiceNo: string;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  amount: number;
  gameName: string | null;
  itemName: string | null;
  denomination: string | null;
  gameImage: string | null;
  gameUserId: string;
  serverId: string | null;
  paymentMethod: string;
  providerTrxId: string | null;
  failureReason: string | null;
  createdAt: string;
};

export default function CekPesananPage() {
  const [invoice, setInvoice] = useState("");
  const [data, setData] = useState<TrackedOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function track(e?: React.FormEvent) {
    e?.preventDefault();
    if (!invoice.trim()) return setError("Masukkan nomor invoice Anda.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/track?invoice=${encodeURIComponent(invoice.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Pesanan tidak ditemukan.");
        setData(null);
      } else {
        setData(json.order);
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
      setSearched(true);
    }
  }

  return (
    <Container className="max-w-2xl py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-primary/10 text-primary">
          <Receipt size={26} />
        </div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Cek Status Pesanan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Masukkan nomor invoice untuk melacak pesanan Anda secara real-time.</p>
      </div>

      <Card className="p-5">
        <form onSubmit={track} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10 font-mono uppercase" placeholder="Contoh: INV-XXXXX" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          </div>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Mencari..." : "Lacak Pesanan"}
          </Button>
        </form>
        {error && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
        <p className="mt-3 text-xs text-muted-foreground">
          Nomor invoice ada di halaman konfirmasi & struk email/WhatsApp Anda. {""}
          <Link href="/account" className="font-semibold text-primary hover:underline">Lihat riwayat pesanan</Link>.
        </p>
      </Card>

      {data && (
        <div className="mt-5 animate-float-up">
          <div
            className={cn(
              "mb-4 flex items-center gap-3 rounded-lg border p-4",
              data.status === "delivered" ? "border-success/40 bg-success/5" : data.status === "failed" ? "border-danger/40 bg-danger/5" : "border-primary/40 bg-primary/5"
            )}
          >
            {data.status === "delivered" ? <CheckCircle2 size={28} className="text-success" /> : data.status === "failed" ? <XCircle size={28} className="text-danger" /> : <Loader2 size={28} className="animate-spin text-primary" />}
            <div>
              <p className="font-bold">{statusTitle(data.status)}</p>
              <p className="text-sm text-muted-foreground">{statusSub(data)}</p>
            </div>
            <Badge tone={data.status === "delivered" ? "success" : data.status === "failed" ? "danger" : "primary"} className="ml-auto">
              {data.status}
            </Badge>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              {data.gameImage && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <Image src={data.gameImage} alt={data.gameName ?? ""} fill sizes="56px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{data.gameName}</p>
                <p className="truncate font-bold">{data.itemName}{data.denomination ? ` · ${data.denomination}` : ""}</p>
                <p className="text-xs text-muted-foreground">ID: {data.gameUserId}{data.serverId ? ` (${data.serverId})` : ""}</p>
              </div>
              <span className="text-lg font-bold text-primary">{formatRupiah(data.amount)}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="No. Invoice" value={data.invoiceNo} mono />
              <Info label="Metode" value={data.paymentMethod} />
              <Info label="Tanggal" value={formatDate(data.createdAt)} />
              <Info label="Resi" value={data.providerTrxId ?? "-"} />
            </div>

            {/* Stepper */}
            <div className="mt-5 border-t border-border pt-4">
              <Step icon={<CreditCard size={15} />} label="Pembayaran" state={paymentState(data)} />
              <Step icon={<PackageCheck size={15} />} label="Pengiriman Item" state={deliveryState(data)} last />
            </div>

            {data.status === "failed" && data.failureReason && (
              <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{data.failureReason}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => track()} variant="outline" size="sm">
                <RefreshCw size={15} /> Refresh Status
              </Button>
              <Button href="/products" variant="outline" size="sm">Top Up Lagi</Button>
            </div>
          </Card>
        </div>
      )}

      {searched && !data && !error && (
        <p className="mt-5 text-center text-sm text-muted-foreground">Pesanan tidak ditemukan.</p>
      )}
    </Container>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("truncate font-semibold", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

function Step({ icon, label, state, last }: { icon: React.ReactNode; label: string; state: "done" | "active" | "pending"; last?: boolean }) {
  const ring = state === "done" ? "bg-success text-white" : state === "active" ? "bg-primary text-white" : "bg-muted text-muted-foreground";
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={cn("grid h-8 w-8 place-items-center rounded-full", ring)}>
          {state === "active" ? <Loader2 size={14} className="animate-spin" /> : state === "done" ? <CheckCircle2 size={15} /> : icon}
        </span>
        {!last && <span className={cn("my-1 w-0.5", state === "done" ? "bg-success" : "bg-border")} style={{ minHeight: 20 }} />}
      </div>
      <div className="pb-4 pt-1">
        <p className={cn("text-sm font-semibold", state === "pending" && "text-muted-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground">{state === "done" ? "Selesai" : state === "active" ? "Diproses..." : "Menunggu"}</p>
      </div>
    </div>
  );
}

function paymentState(o: TrackedOrder) {
  if (o.paymentStatus === "success") return "done";
  if (o.paymentStatus === "failed") return "pending";
  return o.paymentMethod === "Saldo Dompet" ? "done" : "active";
}
function deliveryState(o: TrackedOrder) {
  if (o.deliveryStatus === "success") return "done";
  if (o.status === "processing") return "active";
  return "pending";
}
function statusTitle(s: string) {
  return s === "delivered" ? "Pesanan Berhasil!" : s === "failed" ? "Pesanan Gagal" : s === "processing" ? "Sedang Memproses" : "Menunggu Pembayaran";
}
function statusSub(o: TrackedOrder) {
  if (o.status === "delivered") return `Item telah dikirim ke ID ${o.gameUserId}.`;
  if (o.status === "failed") return "Pesanan tidak dapat diselesaikan. Hubungi support bila perlu.";
  if (o.status === "processing") {
    if (o.failureReason?.includes("manual")) return "Pembayaran terverifikasi. Item sedang dikirim manual oleh admin.";
    return "Pembayaran terverifikasi, item sedang dikirim.";
  }
  return "Selesaikan pembayaran, lalu status diperbarui otomatis.";
}
