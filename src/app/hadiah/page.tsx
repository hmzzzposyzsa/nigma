import { redirect } from "next/navigation";
import Image from "next/image";
import { Lock, Crown, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getActiveEvents } from "@/lib/queries";
import { tierProgress } from "@/lib/tiers";
import { TIERS } from "@/lib/constants";
import { formatRupiah } from "@/lib/format";
import { EventCard } from "@/components/EventCard";
import { Leaderboard } from "@/components/Leaderboard";
import { Container, Card, Button, Badge, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HadiahPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/hadiah");

  if (user.role === "pemula") {
    const progress = tierProgress(user);
    return (
      <Container className="flex min-h-[70vh] items-center justify-center py-12">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-gold/15 text-gold">
            <Lock size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Hadiah Eksklusif</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Halaman ini khusus untuk member <span className="font-semibold text-primary">Langganan</span> & <span className="font-semibold text-gold">Sultan</span>. Naik tier untuk membuka mystery box, leaderboard, dan event spesial lainnya.
          </p>
          <div className="mt-5 rounded-xl border border-border p-4 text-left">
            <p className="text-sm font-semibold">Menuju tier {progress.nextRole ? TIERS[progress.nextRole].label : "Sultan"}</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Belanja {formatRupiah(progress.remaining)} lagi bulan ini untuk naik tier.</p>
          </div>
          <Button href="/products" size="lg" className="mt-5 w-full">Mulai Top Up <ChevronRight size={16} /></Button>
        </Card>
      </Container>
    );
  }

  const events = await getActiveEvents();

  return (
    <Container className="py-8">
      <SectionHeading
        eyebrow="Eksklusif"
        title={`Hadiah untuk ${TIERS[user.role as keyof typeof TIERS].label}`}
        description="Event spesial hanya untuk member Langganan & Sultan. Biaya ditukar dengan Spin Credit yang sudah kamu kumpulkan."
        action={<Badge tone={user.role === "sultan" ? "gold" : "primary"}><Crown size={13} /> {user.creditBalance} Kredit</Badge>}
      />

      <div className="mb-8">
        <Leaderboard />
      </div>

      {events.length === 0 ? (
        <Card className="grid place-items-center py-20 text-center">
          <Lock size={32} className="text-muted-foreground" />
          <p className="mt-3 text-lg font-bold">Belum ada event</p>
          <p className="text-sm text-muted-foreground">Event eksklusif akan muncul di sini saat admin mengaktifkannya.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard
              key={e.id}
              event={{
                id: e.id,
                title: e.title,
                description: e.description ?? "",
                bannerImage: e.bannerImage,
                eventType: e.eventType,
                creditCost: e.creditCost,
                config: e.config as any,
                tierVisibility: e.tierVisibility,
              }}
              role={user.role}
              creditBalance={user.creditBalance}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
