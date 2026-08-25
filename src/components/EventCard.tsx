"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift, Trophy, Package, CalendarCheck, Sparkles, Coins, Loader2, Check, Info } from "lucide-react";
import { Card, Button, Badge, cn } from "./ui";
import { Modal } from "./Modal";
import { formatRupiah } from "@/lib/format";
import { EVENT_CONCEPTS } from "@/lib/constants";

type EventProps = {
  id: string;
  title: string;
  description: string;
  bannerImage: string | null;
  eventType: string;
  creditCost: number;
  config: any;
  tierVisibility: string;
};

const TYPE_META: Record<string, { Icon: any; label: string; tone: any }> = {
  mystery_box: { Icon: Package, label: "Mystery Box", tone: "primary" },
  leaderboard: { Icon: Trophy, label: "Leaderboard", tone: "gold" },
  login_streak: { Icon: CalendarCheck, label: "Streak", tone: "success" },
  community_goal: { Icon: Gift, label: "Community", tone: "primary" },
  quiz: { Icon: Sparkles, label: "Quiz", tone: "primary" },
  referral: { Icon: Gift, label: "Referral", tone: "primary" },
  auction: { Icon: Trophy, label: "Auction", tone: "gold" },
  stamp_card: { Icon: CalendarCheck, label: "Stamp Card", tone: "primary" },
};

export function EventCard({ event, role, creditBalance }: { event: EventProps; role: string; creditBalance: number }) {
  const meta = TYPE_META[event.eventType] ?? { Icon: Gift, label: "Event", tone: "primary" };
  const [modal, setModal] = useState<null | "action" | "info">(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function runAction() {
    setBusy(true);
    setResult(null);
    try {
      if (event.eventType === "login_streak") {
        const r = await fetch("/api/events/checkin", { method: "POST" }).then((r) => r.json());
        setResult(r);
      } else if (event.eventType === "mystery_box") {
        const r = await fetch("/api/events/mystery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creditCost: event.creditCost, silver: event.config?.silver ?? [], gold: event.config?.gold ?? [] }),
        }).then((r) => r.json());
        setResult(r);
      } else {
        setResult({ info: true });
      }
      setModal("action");
    } finally {
      setBusy(false);
    }
  }

  const actionLabel = (() => {
    if (event.eventType === "login_streak") return "Check-in Harian";
    if (event.eventType === "mystery_box") return `Buka Box (${event.creditCost} kredit)`;
    if (event.eventType === "leaderboard") return "Lihat Leaderboard";
    return "Cara Ikut";
  })();

  return (
    <>
      <Card className="flex flex-col overflow-hidden">
        <div className="relative h-36">
          {event.bannerImage ? (
            <Image src={event.bannerImage} alt={event.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-primary/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <Badge tone={meta.tone} className="absolute left-2 top-2 backdrop-blur">
            <meta.Icon size={12} /> {meta.label}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-bold">{event.title}</h3>
          <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{event.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs font-semibold text-primary"><Coins size={13} /> {event.creditCost} kredit</span>
            <span className="text-[11px] text-muted-foreground">{role === "sultan" ? "Gold Box" : "Silver Box"}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={runAction} size="sm" className="flex-1" disabled={busy || (event.eventType === "mystery_box" && creditBalance < event.creditCost)}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <meta.Icon size={15} />} {actionLabel}
            </Button>
            <Button onClick={() => setModal("info")} variant="outline" size="icon" aria-label="Info">
              <Info size={16} />
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={modal === "action"} onClose={() => { setModal(null); setResult(null); }} title={event.title}>
        <div className="p-5">{result && <ActionResult event={event} result={result} />}</div>
      </Modal>
      <Modal open={modal === "info"} onClose={() => setModal(null)} title="Cara Kerja Event">
        <div className="p-5 text-sm text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">{EVENT_CONCEPTS.find((c) => c.type === event.eventType)?.title ?? event.title}</p>
          <p>{EVENT_CONCEPTS.find((c) => c.type === event.eventType)?.desc ?? event.description}</p>
          <p className="mt-3 rounded-lg bg-muted p-2 text-xs">Biaya: {event.creditCost} Spin Credit. Tier kamu menentukan tingkat hadiah (Silver/Gold).</p>
        </div>
      </Modal>
    </>
  );
}

function ActionResult({ event, result }: { event: EventProps; result: any }) {
  if (event.eventType === "login_streak") {
    return (
      <div className="text-center">
        <div className={cn("mx-auto grid h-14 w-14 place-items-center rounded-full", result.ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
          {result.ok ? <Check size={28} /> : <CalendarCheck size={28} />}
        </div>
        <p className="mt-3 font-bold">{result.message}</p>
        {result.streak != null && <p className="text-sm text-muted-foreground">Streak saat ini: {result.streak} hari</p>}
      </div>
    );
  }
  if (event.eventType === "mystery_box" && result.prize) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold"><Package size={30} /></div>
        <p className="mt-3 text-lg font-bold">Kamu Mendapat:</p>
        <p className="text-xl font-bold text-primary">{result.prize}</p>
        {result.voucherCode && <p className="mt-2 font-mono text-lg font-bold text-primary">{result.voucherCode}</p>}
        <p className="mt-2 text-xs text-muted-foreground">Hadiah sudah otomatis masuk ke akunmu.</p>
      </div>
    );
  }
  if (result.error) return <p className="text-sm font-medium text-danger">{result.error}</p>;
  if (result.info) return <p className="text-sm text-muted-foreground">Detail event akan ditampilkan di sini saat event dimulai.</p>;
  return <p className="text-sm text-muted-foreground">{result.message ?? "Selesai."}</p>;
}
