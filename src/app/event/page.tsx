import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRoulettePrizes } from "@/lib/settings";
import { getRecentWins } from "@/lib/queries";
import { RouletteGame } from "@/components/RouletteGame";
import { RecentWinsTicker } from "@/components/RecentWinsTicker";
import { Container, SectionHeading, Badge } from "@/components/ui";
import { Dice5 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/event");
  const [prizes, wins] = await Promise.all([getRoulettePrizes(), getRecentWins(16)]);

  return (
    <Container className="py-8">
      <SectionHeading
        eyebrow="Event"
        title="Prize Roulette"
        description="Tukar 1 Spin Credit untuk memutar roda. Hasil ditentukan di server sebelum animasi — 100% adil & transparan."
        action={<Badge tone="primary"><Dice5 size={13} /> {user.creditBalance} Spin Credit</Badge>}
      />

      {wins.length > 0 && <div className="mb-6"><RecentWinsTicker items={wins} /></div>}

      <RouletteGame credits={user.creditBalance} prizes={prizes} />
    </Container>
  );
}
