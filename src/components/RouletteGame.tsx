"use client";

import { useRef, useState } from "react";
import { RefreshCw, Sparkles, Info, Coins, Gift, Percent } from "lucide-react";
import { Button, Card, Badge, cn } from "./ui";
import { Modal } from "./Modal";
import { formatRupiah } from "@/lib/format";
import type { RoulettePrize } from "@/lib/constants";

export function RouletteGame({ credits, prizes }: { credits: number; prizes: RoulettePrize[] }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [creditsLeft, setCreditsLeft] = useState(credits);
  const [result, setResult] = useState<{ prize: RoulettePrize; voucherCode?: string } | null>(null);
  const [error, setError] = useState("");
  const busy = useRef(false);

  async function spin() {
    if (spinning || creditsLeft < 1 || busy.current) return;
    busy.current = true;
    setError("");
    setSpinning(true);
    let data: any;
    try {
      const res = await fetch("/api/roulette/spin", { method: "POST" });
      data = await res.json();
      if (!res.ok) {
        setSpinning(false);
        busy.current = false;
        return setError(data.error || "Gagal memutar.");
      }
    } catch {
      setSpinning(false);
      busy.current = false;
      return setError("Koneksi bermasalah.");
    }

    const seg = data.segment as number;
    const index = prizes.findIndex((p) => p.segment === seg);
    const center = index * 45 + 22.5;
    const targetWithin = (360 - center + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = 5 * 360 + ((targetWithin - currentMod + 360) % 360);
    const next = rotation + delta;
    setRotation(next);

    window.setTimeout(async () => {
      setSpinning(false);
      setResult({ prize: { ...prizes[index], color: data.prize?.color ?? prizes[index].color }, voucherCode: data.prize?.voucherCode });
      setCreditsLeft((c) => Math.max(0, c - 1));
      busy.current = false;
      // sync exact balance from server
      try {
        const me = await fetch("/api/me").then((r) => r.json());
        if (me.user) setCreditsLeft(me.user.creditBalance);
      } catch {}
    }, 4200);
  }

  const gradient = `conic-gradient(${prizes.map((p, i) => `${p.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(",")})`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card className="flex flex-col items-center p-4 sm:p-6">
        <div className="relative aspect-square w-full max-w-[300px]">
          {/* pointer */}
          <div className="absolute left-1/2 top-[-6px] z-20 -translate-x-1/2">
            <div className="h-0 w-0 border-x-[12px] border-t-[20px] border-x-transparent border-t-gold drop-shadow" />
          </div>
          {/* wheel */}
          <div
            className="absolute inset-0 rounded-full border-8 border-card shadow-md"
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
            }}
          >
            {prizes.map((p, i) => {
              const a = i * 45 + 22.5;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: `rotate(${a}deg) translateY(-110px) rotate(${-a}deg)` }}
                >
                  <span className="block w-20 -translate-x-1/2 text-center text-[10px] font-bold leading-tight text-white drop-shadow">
                    {short(p.label)}
                  </span>
                </div>
              );
            })}
          </div>
          {/* hub */}
          <button
            onClick={spin}
            disabled={spinning || creditsLeft < 1}
            className="absolute left-1/2 top-1/2 z-10 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {spinning ? <RefreshCw size={22} className="animate-spin" /> : <span className="text-center text-xs font-bold leading-tight">SPIN<br />1 Kredit</span>}
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
          <Sparkles size={16} /> {creditsLeft} Spin Credit
        </div>
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        {creditsLeft < 1 && (
          <Button href="/products" size="sm" variant="outline" className="mt-3">
            <Coins size={15} /> Top Up untuk dapat kredit
          </Button>
        )}
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold"><Info size={16} /> Tabel Hadiah</h3>
          <p className="mt-1 text-xs text-muted-foreground">Probabilitas diatur admin. "Coba lagi" sengaja dibuat langka (2%) supaya hampir setiap spin dapat hadiah.</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {prizes.map((p) => (
                  <tr key={p.segment} className="border-b border-border last:border-0">
                    <td className="p-2.5"><span className="inline-block h-3 w-3 rounded-full align-middle" style={{ background: p.color }} /></td>
                    <td className="p-2.5 font-semibold">{p.label}</td>
                    <td className="p-2.5 text-right text-muted-foreground">{(p.probability * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold">Cara Dapat Spin Credit</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2"><Coins size={15} className="mt-0.5 text-primary" /> Setiap transaksi sukses min. Rp5.000 = 1 Spin Credit.</li>
            <li className="flex gap-2"><Gift size={15} className="mt-0.5 text-primary" /> Bonus saat naik ke tier Langganan (+3) & Sultan (+6).</li>
            <li className="flex gap-2"><Percent size={15} className="mt-0.5 text-primary" /> Hadiah bisa cashback saldo, voucher diskon, atau kredit tambahan.</li>
          </ul>
        </Card>
      </div>

      <Modal open={!!result} onClose={() => setResult(null)} title="Hasil Spin">
        {result && <ResultBody prize={result.prize} voucherCode={result.voucherCode} />}
        <div className="p-5 pt-0">
          <Button onClick={() => { setResult(null); }} className="w-full" disabled={creditsLeft < 1 || spinning}>
            {creditsLeft > 0 ? "Spin Lagi" : "Kredit Habis"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ResultBody({ prize, voucherCode }: { prize: RoulettePrize; voucherCode?: string }) {
  const win = prize.type !== "none";
  return (
    <div className="p-5 text-center">
      <div className={cn("mx-auto grid h-16 w-16 place-items-center rounded-full", win ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground")}>
        {prize.type === "cashback" ? <Coins size={30} /> : prize.type === "credit" ? <Sparkles size={30} /> : prize.type === "voucher_pct" ? <Percent size={30} /> : <Info size={30} />}
      </div>
      <p className="mt-3 text-lg font-bold">{win ? "Selamat!" : "Belum Beruntung"}</p>
      <p className="text-sm text-muted-foreground">{prize.label}</p>
      {voucherCode && (
        <div className="mt-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">Kode Voucher (pakai saat checkout)</p>
          <p className="font-mono text-lg font-bold text-primary">{voucherCode}</p>
        </div>
      )}
      {prize.type === "cashback" && <p className="mt-2 text-xs text-success">Cashback langsung masuk ke saldo dompetmu.</p>}
    </div>
  );
}

function short(label: string) {
  return label.length > 16 ? label.slice(0, 15) + "…" : label;
}
