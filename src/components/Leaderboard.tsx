"use client";

import { useEffect, useState } from "react";
import { Trophy, Crown, Medal, Coins } from "lucide-react";
import { Card, Badge, cn, Spinner } from "./ui";
import { formatRupiah } from "@/lib/format";

type Row = { rank: number; name: string; role: string; total: number };

export function Leaderboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/events/leaderboard")
      .then((r) => r.json())
      .then((d) => active && setRows(d.leaderboard ?? []))
      .catch(() => active && setRows([]));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (!rows) {
    return (
      <Card className="flex items-center justify-center p-8">
        <Spinner className="text-primary" />
      </Card>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 10);
  const topTotal = rows[0]?.total ?? 1;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold">
          <Trophy size={18} />
        </span>
        <div>
          <h3 className="text-lg font-bold">Leaderboard Belanja Mingguan</h3>
          <p className="text-xs text-muted-foreground">Member Langganan & Sultan dengan pengeluaran tertinggi minggu ini.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="grid place-items-center py-12 text-center">
          <Trophy size={28} className="text-muted-foreground" />
          <p className="mt-2 font-semibold">Belum ada aktivitas</p>
          <p className="text-sm text-muted-foreground">Lakukan top-up untuk masuk leaderboard minggu ini!</p>
        </Card>
      ) : (
        <>
          {/* Podium */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[1, 0, 2].map((idx) => {
              const r = podium[idx];
              if (!r) return <div key={idx} />;
              const isFirst = idx === 0;
              return (
                <div
                  key={r.rank}
                  className={cn(
                    "flex flex-col items-center justify-end rounded-lg border p-3 text-center",
                    isFirst ? "border-gold/50 bg-gold/10 pb-5" : "border-border bg-card"
                  )}
                  style={{ minHeight: isFirst ? 130 : 110 }}
                >
                  <span className={cn("mb-1 grid h-9 w-9 place-items-center rounded-full", isFirst ? "bg-gold text-black" : idx === 1 ? "bg-muted-foreground/30 text-foreground" : "bg-muted text-muted-foreground")}>
                    {isFirst ? <Crown size={18} /> : <Medal size={16} />}
                  </span>
                  <p className="truncate text-sm font-bold">{r.name.split(" ")[0]}</p>
                  <Badge tone={r.role === "sultan" ? "gold" : "primary"} className="mt-1 text-[10px]">{r.role}</Badge>
                  <p className="mt-1 text-xs font-bold text-primary">{formatRupiah(r.total)}</p>
                </div>
              );
            })}
          </div>

          {/* Rest of list */}
          {rest.length > 0 && (
            <Card className="divide-y divide-border">
              {rest.map((r) => (
                <div key={r.rank} className="flex items-center gap-3 p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{r.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (r.total / topTotal) * 100)}%` }} />
                    </div>
                  </div>
                  <Badge tone={r.role === "sultan" ? "gold" : "primary"} className="shrink-0">{r.role}</Badge>
                  <span className="shrink-0 text-sm font-bold">{formatRupiah(r.total)}</span>
                </div>
              ))}
            </Card>
          )}

          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins size={13} /> Hadiah voucher & bonus Spin Credit untuk pemenang — direset setiap minggu.
          </p>
        </>
      )}
    </div>
  );
}
