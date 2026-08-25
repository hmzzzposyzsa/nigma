import { Gamepad2, ShieldCheck, CreditCard, Rocket, ChevronRight } from "lucide-react";
import { Container, Button, SectionHeading } from "@/components/ui";
import { BannerCarousel } from "@/components/BannerCarousel";
import { FlashSaleSection } from "@/components/FlashSaleSection";
import { RecentWinsTicker } from "@/components/RecentWinsTicker";
import { GameCard } from "@/components/GameCard";
import { getCurrentUser } from "@/lib/auth";
import { getBanners, getPopularGames, getActiveFlashSales, getRecentWins } from "@/lib/queries";
import type { TierKey } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STEPS = [
  { Icon: Gamepad2, title: "Pilih Game & Nominal", desc: "Pilih game favorit dan jumlah diamond atau UC yang kamu inginkan." },
  { Icon: ShieldCheck, title: "Masukkan ID Game", desc: "Isi ID Game (dan Server bila perlu). Kami verifikasi otomatis via API game." },
  { Icon: CreditCard, title: "Bayar dengan Mudah", desc: "QRIS, e-wallet, Virtual Account, gerai retail, atau langsung dari saldo dompet." },
  { Icon: Rocket, title: "Item Langsung Masuk", desc: "Pesanan diproses otomatis 24/7 dan dikirim langsung ke akun gim kamu." },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const role = (user?.role as TierKey) ?? "pemula";

  const [banners, popularGames, flashSales, wins] = await Promise.all([
    getBanners(),
    getPopularGames(role),
    getActiveFlashSales(role),
    getRecentWins(14),
  ]);

  return (
    <Container className="py-6 sm:py-8">
      <BannerCarousel banners={banners} />

      {wins.length > 0 && <div className="mt-4">{<RecentWinsTicker items={wins} />}</div>}

      {flashSales.length > 0 && (
        <div id="flash-sale" className="mt-8">
          <FlashSaleSection sales={flashSales} />
        </div>
      )}

      {/* Game grid — popular games only */}
      <section className="mt-12">
        <SectionHeading
          eyebrow="Katalog"
          title="Game Populer"
          description="Pilih dari game-game favorit. Harga otomatis menyesuaikan tier member kamu."
        />
        {popularGames.length === 0 ? (
          <div className="grid place-items-center rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-base font-bold">Belum ada produk tersedia</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Katalog sedang kosong. Produk akan muncul otomatis di sini setelah admin menambahkannya di database bersama.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {popularGames.map((g) => (
                <GameCard key={g.id} slug={g.slug} name={g.name} imageUrl={g.imageUrl} category={g.category} minPrice={g.minPrice} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button href="/products" variant="outline">
                Lihat Semua Game <ChevronRight size={16} />
              </Button>
            </div>
          </>
        )}
      </section>

      {/* How it works */}
      <section className="cv-auto mt-16">
        <SectionHeading eyebrow="Cara Top-Up" title="Selesai dalam 4 Langkah" description="Proses cepat dan otomatis — tanpa nunggu admin." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, desc }, i) => (
            <div key={title} className="relative rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} />
                </span>
                <span className="font-mono text-sm font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

    </Container>
  );
}
