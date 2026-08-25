"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Flame, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { formatRupiah } from "@/lib/format";
import type { FlashSaleCard } from "@/lib/queries";
import { cn } from "./ui";

export function FlashSaleSection({ sales }: { sales: FlashSaleCard[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  if (!sales.length) return null;
  const earliest = sales.reduce((a, b) => (a.endAt.getTime() < b.endAt.getTime() ? a : b));

  const scrollBy = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-danger/30 bg-gradient-to-br from-danger/10 via-card to-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger text-white">
            <Flame size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Flash Sale</h2>
            <p className="text-xs text-muted-foreground">Diskon kilat — berakhir segera!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-danger">Berakhir dalam</span>
          <CountdownTimer endAt={earliest.endAt} />
          <div className="hidden gap-1 sm:flex">
            <button onClick={() => scrollBy(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-muted" aria-label="Sebelumnya">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scrollBy(1)} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-muted" aria-label="Berikutnya">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div ref={scroller} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto p-5">
        {sales.map((s) => {
          const stockPct = s.stockLimit ? Math.min(100, (s.soldCount / s.stockLimit) * 100) : 0;
          const low = s.stockLimit != null && s.stockLimit - s.soldCount <= 5;
          return (
            <Link
              key={s.saleId}
              href={`/products/${s.gameSlug}?p=${s.productId}`}
              className="group w-[230px] shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-card transition hover:-translate-y-1 hover:border-danger/50 hover:shadow-sm"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={s.imageUrl} alt={s.gameName} fill sizes="230px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute left-2 top-2 rounded-md bg-danger px-2 py-0.5 text-xs font-bold text-white">
                  {s.discountLabel}
                </span>
                <p className="absolute bottom-2 left-2 text-sm font-bold text-white drop-shadow">{s.gameName}</p>
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-semibold">
                  {s.itemName}
                  {s.denomination ? ` · ${s.denomination}` : ""}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-danger">{formatRupiah(s.salePrice)}</span>
                  <span className="text-xs text-muted-foreground line-through">{formatRupiah(s.originalPrice)}</span>
                </div>
                {s.stockLimit ? (
                  <div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full", low ? "bg-danger" : "bg-primary")} style={{ width: `${stockPct}%` }} />
                    </div>
                    <p className={cn("mt-1 text-[11px] font-semibold", low ? "text-danger" : "text-muted-foreground")}>
                      {low ? `Sisa ${s.stockLimit - s.soldCount} stok!` : `Terjual ${s.soldCount}/${s.stockLimit}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Stok tersedia</p>
                )}
                <div className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-danger py-2 text-sm font-bold text-white transition group-hover:brightness-110">
                  <Zap size={14} /> Beli Sekarang
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
