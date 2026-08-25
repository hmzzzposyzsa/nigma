import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, deposits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      lastMonthRole: user.lastMonthRole,
      balance: user.balance,
      creditBalance: user.creditBalance,
      monthlySpend: user.monthlySpend,
      totalSpend: user.totalSpend,
      streakDays: user.streakDays,
      createdAt: user.createdAt,
    },
  });
}

// Also expose recent order/deposit counts for the account dashboard.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const recentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(8);
  const recentDeposits = await db
    .select()
    .from(deposits)
    .where(eq(deposits.userId, user.id))
    .orderBy(desc(deposits.createdAt))
    .limit(8);
  return Response.json({ orders: recentOrders, deposits: recentDeposits });
}
