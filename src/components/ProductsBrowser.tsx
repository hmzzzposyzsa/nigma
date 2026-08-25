"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GameCard } from "./GameCard";
import { Input, cn } from "./ui";

type Item = { id: string; slug: string; name: string; imageUrl: string; category: string; minPrice: number | null };

export function ProductsBrowser({ games, categories }: { games: Item[]; categories: string[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("Semua");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return games.filter((g) => {
      const matchCat = cat === "Semua" || g.category === cat;
      const matchQ = !query || g.name.toLowerCase().includes(query);
      return matchCat && matchQ;
    });
  }, [games, q, cat]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Cari game..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {["Semua", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                cat === c ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">Game tidak ditemukan. Coba kata kunci lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {filtered.map((g) => (
            <GameCard key={g.id} slug={g.slug} name={g.name} imageUrl={g.imageUrl} category={g.category} minPrice={g.minPrice} />
          ))}
        </div>
      )}
    </div>
  );
}
