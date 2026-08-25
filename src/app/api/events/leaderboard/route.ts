import { sql, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { maskName } from "@/lib/format";

export async function GET() {
  const since = new Date(Date.now() - 7 * 86_400_000);
  const rows = await db
    .select({
      name: users.name,
      role: users.role,
      total: sql<number>`coalesce(sum(${orders.amount}),0)::int`,
    })
    .from(users)
    .leftJoin(orders, sql`${orders.userId} = ${users.id} and ${orders.status} = 'delivered' and ${orders.createdAt} >= ${since}`)
    .where(inArray(users.role, ["langganan", "sultan"]))
    .groupBy(users.id, users.name, users.role)
    .orderBy(sql`sum(${orders.amount}) desc nulls last`)
    .limit(10);

  return Response.json({
    leaderboard: rows
      .filter((r) => r.total > 0)
      .map((r, i) => ({ rank: i + 1, name: maskName(r.name), role: r.role, total: r.total })),
  });
}
