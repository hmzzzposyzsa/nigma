"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  CreditCard,
  PackageCheck,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { Container, Button, Badge, Spinner, cn } from "@/components/ui";
import { formatRupiah, formatDate } from "@/lib/format";

type Order = {
  id: string;
  invoiceNo: string;
  gameUserId: string;
  serverId: string | null;
  contact: string;
  paymentMethod: string;
  paidWithBalance: boolean;
  amount: number;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  providerTrxId: string | null;
  failureReason: string | null;
  createdAt: string;
  snapshot: any;
};

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    if (res.ok) setOrder(data.order);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const active = order?.status === "pending" || order?.status === "processing";
  useEffect(() => {
    if (!order || !active) return;
    const t = setInterval(() => refresh(true), 4000);
    return () => clearInterval(t);
  }, [order, active]);

  async function refresh(silent = false) {
    if (!silent) setChecking(true);
    try {
      const res = await fetch(`/api/orders/${id}/check`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setOrder(data.order);
    } finally {
      if (!silent) setChecking(false);
    }
  }

  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-6 w-6 text-primary" />
      </Container>
    );
  }
  if (!order) {
    return (
      <Container className="py-20 text-center">
        <p className="text-lg font-bold">Pesanan tidak ditemukan</p>
        <Button href="/" className="mt-4">Kembali ke Beranda</Button>
      </Container>
    );
  }

  const snap = order.snapshot ?? {};
  const delivered = order.status === "delivered";
  const failed = order.status === "failed";

  return (
    <Container className="max-w-2xl py-8">
      <div className="mb-5 overflow-hidden rounded-xl border border-border">
        <div
          className={cn(
            "flex flex-col items-center px-6 py-8 text-center",
            delivered ? "bg-success/10" : failed ? "bg-danger/10" : "bg-primary/5"
          )}
        >
          {delivered ? (
            <PartyPopper size={44} className="text-success" />
          ) : failed ? (
            <XCircle size={44} className="text-danger" />
          ) : (
            <Loader2 size={44} className="animate-spin text-primary" />
          )}
          <h1 className="mt-3 text-2xl font-bold">{statusTitle(order.status)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{statusSub(order)}</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone={delivered ? "success" : failed ? "danger" : "primary"}>{statusLabel(order.status)}</Badge>
            <span className="text-xs text-muted-foreground">Invoice {order.invoiceNo}</span>
          </div>
          {(active || failed) && (
            <Button onClick={() => refresh()} variant="outline" size="sm" className="mt-4" disabled={checking}>
              {checking ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Cek Status Sekarang
            </Button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-5 rounded-lg border border-border bg-card p-5">
        <Step icon={<CreditCard size={16} />} label="Pembayaran" state={paymentStepState(order)} />
        <Step icon={<PackageCheck size={16} />} label="Pengiriman Item" state={deliveryStepState(order)} last />
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            {snap.gameImage && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <Image src={snap.gameImage} alt={snap.gameName ?? ""} fill sizes="56px" className="object-cover" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">{snap.gameName}</p>
              <p className="font-bold">{snap.itemName}{snap.denomination ? ` · ${snap.denomination}` : ""}</p>
              <p className="text-xs text-muted-foreground">ID: {order.gameUserId}{order.serverId ? ` (${order.serverId})` : ""}</p>
            </div>
            <span className="ml-auto text-lg font-bold text-primary">{formatRupiah(order.amount)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Metode" value={order.paidWithBalance ? "Saldo Dompet" : order.paymentMethod} />
          <Info label="Kontak" value={order.contact} />
          <Info label="Dibuat" value={formatDate(order.createdAt)} />
          <Info label="Resi Pengiriman" value={order.providerTrxId ?? "-"} />
        </div>

        {failed && order.failureReason && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{order.failureReason}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button href="/products" variant="outline">
            Top Up Lagi
          </Button>
          <Button href="/account">
            Lihat Riwayat <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Container>
  );
}

function Step({ icon, label, state, last }: { icon: React.ReactNode; label: string; state: "done" | "active" | "pending"; last?: boolean }) {
  const ring = state === "done" ? "bg-success text-white" : state === "active" ? "bg-primary text-white" : "bg-muted text-muted-foreground";
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={cn("grid h-8 w-8 place-items-center rounded-full", ring)}>
          {state === "active" ? <Loader2 size={15} className="animate-spin" /> : state === "done" ? <CheckCircle2 size={16} /> : icon}
        </span>
        {!last && <span className={cn("my-1 w-0.5 flex-1", state === "done" ? "bg-success" : "bg-border")} style={{ minHeight: 24 }} />}
      </div>
      <div className="pb-5 pt-1">
        <p className={cn("text-sm font-semibold", state === "pending" && "text-muted-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground">
          {state === "done" ? "Selesai" : state === "active" ? "Sedang diproses..." : "Menunggu"}
        </p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-semibold">{value}</p>
    </div>
  );
}

function paymentStepState(o: Order) {
  if (o.paymentStatus === "success") return "done";
  if (o.paymentStatus === "failed") return "pending";
  return o.paidWithBalance ? "done" : "active";
}
function deliveryStepState(o: Order) {
  if (o.deliveryStatus === "success") return "done";
  if (o.status === "processing") return "active";
  return "pending";
}
function statusTitle(s: string) {
  return s === "delivered" ? "Pesanan Berhasil!" : s === "failed" ? "Pesanan Gagal" : s === "processing" ? "Sedang Memproses" : "Menunggu Pembayaran";
}
function statusLabel(s: string) {
  const map: Record<string, string> = { delivered: "Sukses", failed: "Gagal", processing: "Diproses", pending: "Pending" };
  return map[s] ?? s;
}
function statusSub(o: Order) {
  if (o.status === "delivered") return `Item telah dikirim ke ID ${o.gameUserId}.`;
  if (o.status === "failed") return "Maaf, pesanan tidak dapat diselesaikan. Coba cek ulang atau hubungi support.";
  if (o.status === "processing") {
    if (o.failureReason?.includes("manual")) return "Pembayaran terverifikasi. Item sedang dikirim manual oleh admin — mohon tunggu sebentar.";
    return "Pembayaran terverifikasi, item sedang dikirim.";
  }
  return "Selesaikan pembayaran, lalu status diperbarui otomatis.";
}
