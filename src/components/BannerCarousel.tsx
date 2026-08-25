"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui";

type Banner = {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
};

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = useState(0);
  const count = banners.length;

  const next = useCallback(() => setIdx((i) => (i + 1) % count), [count]);
  const prev = () => setIdx((i) => (i - 1 + count) % count);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next, count]);

  useEffect(() => {
    setIdx(0);
  }, [count]);

  if (!count) return null;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border">
      <div className="relative h-[260px] sm:h-[340px] lg:h-[420px]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <Image
              src={b.imageUrl}
              alt={b.title ?? "Promo NexusTop"}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover ${i === idx ? "scale-105" : "scale-100"} transition-transform duration-[6000ms] ease-out`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/55 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-lg px-6 sm:px-10">
                <div className="animate-float-up space-y-3">
                  {b.title && (
                    <h2 className="text-2xl font-bold leading-tight text-foreground drop-shadow-sm sm:text-4xl lg:text-5xl">
                      {b.title}
                    </h2>
                  )}
                  {b.subtitle && <p className="max-w-md text-sm text-foreground/80 sm:text-base">{b.subtitle}</p>}
                  {b.ctaText && b.ctaLink && (
                    <Button href={b.ctaLink} size="lg" className="mt-2">
                      {b.ctaText}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide sebelumnya"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full border border-border bg-card/80 p-2 text-foreground backdrop-blur transition hover:bg-card sm:grid"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Slide berikutnya"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 place-items-center rounded-full border border-border bg-card/80 p-2 text-foreground backdrop-blur transition hover:bg-card sm:grid"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-6 flex gap-1.5 sm:left-10">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-3 bg-foreground/30 hover:bg-foreground/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
