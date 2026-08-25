import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Badge } from "./ui";

export function GameCard({
  slug,
  name,
  imageUrl,
  category,
  minPrice,
}: {
  slug: string;
  name: string;
  imageUrl: string;
  category: string;
  minPrice: number | null;
}) {
  return (
    <Link
      href={`/products/${slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-sm hover:"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 18vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <Badge tone="primary" className="absolute left-2 top-2 backdrop-blur">
          {category}
        </Badge>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="text-base font-bold text-white drop-shadow">{name}</h3>
          {minPrice != null ? (
            <p className="text-xs text-white/80">
              Mulai <span className="font-bold text-white">{formatRupiah(minPrice)}</span>
            </p>
          ) : (
            <p className="text-xs text-white/70">Segera hadir</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-sm font-semibold text-primary">Top Up</span>
        <ChevronRight size={16} className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}
