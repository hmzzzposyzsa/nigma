import { Trophy } from "lucide-react";
import { timeAgo } from "@/lib/format";

export function RecentWinsTicker({
  items,
}: {
  items: { name: string; prizeLabel: string; createdAt: Date | string }[];
}) {
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-card to-transparent" />
      <div className="flex w-max animate-ticker items-center gap-8 pl-4">
        {loop.map((it, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
            <Trophy size={13} className="text-gold" />
            <span className="font-semibold text-foreground">{it.name.split(" ")[0]}</span>
            menang <span className="font-semibold text-primary">{it.prizeLabel}</span>
            <span className="text-muted-foreground/60">· {timeAgo(it.createdAt)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
