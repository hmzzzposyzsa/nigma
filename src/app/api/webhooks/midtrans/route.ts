import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, deposits } from "@/db/schema";
import { advanceOrder } from "@/lib/payments";
import { finalizeDeposit } from "@/lib/payments";

/**
 * Midtrans payment notification webhook (HTTP signature verified by the gateway
 * server key in production). Must be reachable on a public HTTPS URL — hosted on
 * Vercel in the reference architecture. Falls back to polling via the /check
 * endpoints for reliability.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response("ok", { status: 200 });
  const orderId: string = body.order_id ?? body.transaction_id ?? "";
  try {
    if (orderId.startsWith("DEP-")) {
      const dep = (await db.select().from(deposits).where(eq(deposits.invoiceNo, orderId)).limit(1))[0];
      if (dep) await finalizeDeposit(dep.id);
    } else if (orderId.startsWith("INV-")) {
      const order = (await db.select().from(orders).where(eq(orders.invoiceNo, orderId)).limit(1))[0];
      if (order) await advanceOrder(order.id);
    }
  } catch (e) {
    console.error("[midtrans-webhook]", e);
  }
  return new Response("ok", { status: 200 });
}
