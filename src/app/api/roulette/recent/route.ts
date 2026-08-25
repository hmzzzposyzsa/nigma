import { desc } from "drizzle-orm";
import { db } from "@/db";
import { rouletteSpins, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      name: users.name,
      prizeLabel: rouletteSpins.prizeLabel,
      createdAt: rouletteSpins.createdAt,
    })
    .from(rouletteSpins)
    .innerJoin(users, eq(users.id, rouletteSpins.userId))
    .orderBy(desc(rouletteSpins.createdAt))
    .limit(16);
  return Response.json({ wins: rows });
}
