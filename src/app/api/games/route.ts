import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { games } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select({ id: games.id, name: games.name, slug: games.slug, category: games.category })
    .from(games)
    .where(eq(games.isActive, true))
    .orderBy(asc(games.sortOrder), asc(games.name));
  return Response.json({ games: rows });
}
