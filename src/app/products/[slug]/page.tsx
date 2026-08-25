import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Tag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getGameBySlug, getProductsForGame, getActiveFlashSalesForGame } from "@/lib/queries";
import { getCreditPerRupiah } from "@/lib/settings";
import { tierDiscountLabel } from "@/lib/tiers";
import { PurchaseFlow } from "@/components/PurchaseFlow";
import { SocialLinks } from "@/components/SocialLinks";
import { Container, Badge } from "@/components/ui";
import type { TierKey } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  return { title: game ? `Top Up ${game.name}` : "Game" };
}

export default async function GameDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ p?: string }> }) {
  const { slug } = await params;
  const { p } = await searchParams;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const user = await getCurrentUser();
  const role = (user?.role as TierKey) ?? "pemula";
  const [products, salesMap, creditPerRupiah] = await Promise.all([
    getProductsForGame(game.id, role),
    getActiveFlashSalesForGame(game.id),
    getCreditPerRupiah(),
  ]);

  return (
    <Container className="py-6">
      <Link href="/products" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ChevronLeft size={16} /> Semua Game
      </Link>

      <div className="relative mb-6 overflow-hidden rounded-xl border border-border">
        <div className="relative h-44 sm:h-56">
          <Image src={game.imageUrl} alt={game.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
            <Badge tone="primary" className="w-fit">{game.category}</Badge>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{game.name}</h1>
            {game.publisher && <p className="text-sm text-muted-foreground">{game.publisher}</p>}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">{game.description}</p>
        <Badge tone={role === "pemula" ? "muted" : "success"} className="w-fit shrink-0">
          <Tag size={13} /> {tierDiscountLabel(role)} · Tier {role}
        </Badge>
      </div>

      {products.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-base font-bold">Produk belum tersedia</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Belum ada denominasi untuk {game.name} di database. Silakan kembali nanti atau pilih game lain.
          </p>
        </div>
      ) : (
      <PurchaseFlow
        game={{
          id: game.id,
          name: game.name,
          needsServerId: game.needsServerId,
          idFieldLabel: game.idFieldLabel,
          serverFieldLabel: game.serverFieldLabel,
          idPlaceholder: game.idPlaceholder ?? "Masukkan ID Game",
          gameCode: game.slug,
        }}
        products={products}
        salesMap={salesMap}
        role={role}
        balance={user?.balance ?? null}
        creditPerRupiah={creditPerRupiah}
        initialProductId={p}
        contactPrefill={user?.email ?? user?.phone ?? undefined}
      />
      )}

      <div className="mt-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Butuh bantuan dengan {game.name}?</p>
        <SocialLinks size="sm" />
      </div>
    </Container>
  );
}
