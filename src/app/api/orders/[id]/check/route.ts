import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { advanceOrder } from "@/lib/payments";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!order) return Response.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  const user = await getCurrentUser();
  const canView = !order.userId || order.userId === user?.id;
  if (!canView) return Response.json({ error: "Akses ditolak" }, { status: 403 });

  const updated = await advanceOrder(id);
  return Response.json({ order: updated });
}
