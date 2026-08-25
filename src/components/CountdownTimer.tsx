"use client";

import { useEffect, useState } from "react";

function getRemaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  return { diff, days, hours, mins, secs };
}

export function CountdownTimer({
  endAt,
  className = "",
  onEnd,
}: {
  endAt: string | number | Date;
  className?: string;
  onEnd?: () => void;
}) {
  const target = new Date(endAt).getTime();
  const [t, setT] = useState(() => getRemaining(target));

  useEffect(() => {
    const id = setInterval(() => {
      const r = getRemaining(target);
      setT(r);
      if (r.diff <= 0) {
        clearInterval(id);
        onEnd?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onEnd]);

  if (t.diff <= 0) {
    return <span className={className}>Berakhir</span>;
  }
  const cells = [
    { v: t.days, l: "Hari" },
    { v: t.hours, l: "Jam" },
    { v: t.mins, l: "Men" },
    { v: t.secs, l: "Det" },
  ];
  const danger = t.diff < 3_600_000;
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {cells.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className={`grid min-w-[2rem] place-items-center rounded-md px-1 py-1 text-center font-mono text-sm font-bold tabular-nums ${
              danger ? "bg-danger text-white" : "bg-card text-foreground"
            }`}
          >
            {String(c.v).padStart(2, "0")}
          </span>
          {i < cells.length - 1 && <span className="text-xs text-muted-foreground">{c.l}</span>}
        </div>
      ))}
    </div>
  );
}
