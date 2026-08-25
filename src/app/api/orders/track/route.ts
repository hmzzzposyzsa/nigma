import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Public order tracking by invoice number. The invoice number itself is the
 * access key (it's on the customer's receipt), so no login is required to look
 * up an order's status. Returns only status-relevant fields.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const invoice = (url.searchParams.get("invoice") || "").trim().toUpperCase();

  if (!invoice || invoice.length < 4) {
    return Response.json({ error: "Masukkan nomor invoice (minimal 4 karakter)." }, { status: 400 });
  }

  const order = (await db.select().from(orders).where(eq(orders.invoiceNo, invoice)).limit(1))[0];
  if (!order) {
    return Response.json({ error: "Pesanan tidak ditemukan. Periksa kembali nomor invoice Anda." }, { status: 404 });
  }

  const snap = (order.snapshot as any) ?? {};
  return Response.json({
    order: {
      invoiceNo: order.invoiceNo,
      status: order.status,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      amount: order.amount,
      gameName: snap.gameName ?? null,
      itemName: snap.itemName ?? null,
      denomination: snap.denomination ?? null,
      gameImage: snap.gameImage ?? null,
      gameUserId: order.gameUserId,
      serverId: order.serverId,
      paymentMethod: order.paidWithBalance ? "Saldo Dompet" : order.paymentMethod,
      providerTrxId: order.providerTrxId,
      failureReason: order.failureReason,
      createdAt: order.createdAt,
    },
  });
}
