import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { getSecret } from "@/lib/secrets";
import { recordSuccessfulSpend, addNotification } from "@/lib/ledger";
import { notifyOrderDelivered } from "@/lib/telegram";
import { sendEmail, sendWhatsapp } from "@/lib/integrations";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Mark a manual-delivery order as delivered. Called by the separately-hosted
 * admin panel after the admin manually sends the item to the customer.
 * Protected by the ADMIN_API_KEY (stored in settings).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Auth: require admin API key
  const adminKey = await getSecret("ADMIN_API_KEY");
  const provided = req.headers.get("x-admin-key");
  if (!adminKey || provided !== adminKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!order) return Response.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  if (order.deliveryStatus === "success") {
    return Response.json({ error: "Pesanan sudah dikirim" }, { status: 400 });
  }

  const snap = (order.snapshot as any) ?? {};

  // Mark as delivered
  await db
    .update(orders)
    .set({
      deliveryStatus: "success",
      status: "delivered",
      failureReason: null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  // Award credits & update tier
  if (order.userId) {
    await recordSuccessfulSpend(order.userId, order.amount, order.invoiceNo);
    await addNotification(order.userId, "Pesanan Berhasil", `${snap.itemName ?? "Item"} telah dikirim ke ${order.gameUserId}.`, "success");
  }

  // Telegram log
  await notifyOrderDelivered({ invoiceNo: order.invoiceNo, itemName: snap.itemName ?? "Item", amount: order.amount });

  // Email/WhatsApp receipt
  const contact = order.contact;
  const tasks: Promise<unknown>[] = [];
  if (contact.includes("@")) {
    tasks.push(
      sendEmail({
        to: contact,
        subject: `Pesanan ${order.invoiceNo} Berhasil`,
        html: `<p>Pesanan <b>${snap.itemName ?? "item"}</b> untuk ID <b>${order.gameUserId}</b> telah berhasil dikirim.</p><p>Total: ${formatRupiah(order.amount)}</p>`,
      })
    );
  } else {
    tasks.push(
      sendWhatsapp({
        to: contact.replace(/\D/g, ""),
        message: `NexusTop: Pesanan ${order.invoiceNo} BERHASIL. ${snap.itemName ?? "Item"} sudah dikirim ke ID ${order.gameUserId}.`,
      })
    );
  }
  await Promise.allSettled(tasks);

  return Response.json({ ok: true, message: "Order marked as delivered" });
}
