import { getCurrentUser } from "@/lib/auth";
import { getFeaturedGames } from "@/lib/queries";
import { ProductsBrowser } from "@/components/ProductsBrowser";
import { Container, SectionHeading } from "@/components/ui";
import type { TierKey } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const role = (user?.role as TierKey) ?? "pemula";
  const games = await getFeaturedGames(role);
  const categories = Array.from(new Set(games.map((g) => g.category)));

  return (
    <Container className="py-8">
      <SectionHeading eyebrow="Katalog" title="Semua Game" description="Cari game favoritmu dan top-up dalam hitungan detik." />
      <ProductsBrowser games={games} categories={categories} />
    </Container>
  );
}
