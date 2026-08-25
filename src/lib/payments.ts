import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, deposits, products, games } from "@/db/schema";
import { getPaymentStatus, deliverOrder, sendEmail, sendWhatsapp } from "./integrations";
import { adjustWallet, recordSuccessfulSpend, addNotification } from "./ledger";
import { formatRupiah } from "./format";
import {
  notifyOrderDelivered,
  notifyOrderFailed,
  notifyManualDeliveryNeeded,
  notifyDepositSuccess,
} from "./telegram";

type Snap = {
  gameName?: string;
  itemName?: string;
  denomination?: string | null;
  gameCode?: string;
  instructions?: { vaNumber?: string; vaBank?: string; qrString?: string; deeplinkUrl?: string; redirectUrl?: string };
};

function contactKind(contact: string): { email?: string; phone?: string } {
  if (contact.includes("@")) return { email: contact };
  const digits = contact.replace(/\D/g, "");
  return { phone: digits };
}

async function notifyReceipt(opts: { contact: string; subject: string; body: string; wa: string }) {
  const { email, phone } = contactKind(opts.contact);
  const tasks: Promise<unknown>[] = [];
  if (email) tasks.push(sendEmail({ to: email, subject: opts.subject, html: `<div style="font-family:sans-serif">${opts.body}</div>` }));
  if (phone) tasks.push(sendWhatsapp({ to: phone, message: opts.wa }));
  await Promise.allSettled(tasks);
}

/** Re-read an order after mutation. */
export async function getOrder(id: string) {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0];
}

/** Drive an order forward: payment verification (gateway) then delivery. */
export async function advanceOrder(orderId: string) {
  let order = await getOrder(orderId);
  if (!order) throw new Error("Order tidak ditemukan");
  const snap = (order.snapshot as Snap | null) ?? {};
  const product = (await db.select().from(products).where(eq(products.id, order.productId)).limit(1))[0];

  // 1) Verify payment for gateway orders (balance orders are already paid).
  if (order.paymentStatus === "pending" && !order.paidWithBalance) {
    const ps = await getPaymentStatus(order.invoiceNo);
    if (ps.status === "success") {
      await db
        .update(orders)
        .set({ paymentStatus: "success", status: "processing", providerTrxId: ps.transactionStatus, updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    } else if (ps.status === "failed") {
      await db
        .update(orders)
        .set({ paymentStatus: "failed", status: "failed", failureReason: "Pembayaran gagal atau kedaluwarsa", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      return getOrder(orderId);
    }
    order = await getOrder(orderId);
  }

  // 2) Deliver once paid.
  if (order.paymentStatus === "success" && order.deliveryStatus !== "success") {
    const deliveryMethod = (product as any)?.deliveryMethod ?? "provider";

    if (deliveryMethod === "manual") {
      // MANUAL delivery: don't call provider API. Mark as processing & notify admin.
      await db
        .update(orders)
        .set({ status: "processing", failureReason: "Menunggu pengiriman manual oleh admin", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      await notifyManualDeliveryNeeded({
        invoiceNo: order.invoiceNo,
        itemName: snap.itemName ?? "Item",
        gameName: snap.gameName ?? "",
        gameUserId: order.gameUserId,
        serverId: order.serverId ?? undefined,
      });
      return getOrder(orderId);
    }

    // PROVIDER delivery: auto-deliver via ApiGames/SekaliPay.
    await db.update(orders).set({ status: "processing", updatedAt: new Date() }).where(eq(orders.id, orderId));
    const deliv = await deliverOrder({
      ref: order.invoiceNo,
      sku: product?.sku ?? "",
      gameCode: snap.gameCode,
      userId: order.gameUserId,
      serverId: order.serverId ?? undefined,
      provider: product?.provider,
    });
    if (deliv.status === "success") {
      await db
        .update(orders)
        .set({
          deliveryStatus: "success",
          status: "delivered",
          providerTrxId: deliv.trxId ?? order.providerTrxId,
          failureReason: null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
      await notifyOrderDelivered({ invoiceNo: order.invoiceNo, itemName: snap.itemName ?? "Item", amount: order.amount });
      if (order.userId) {
        await recordSuccessfulSpend(order.userId, order.amount, order.invoiceNo);
        await addNotification(order.userId, "Pesanan Berhasil", `${snap.itemName ?? "Item"} telah dikirim ke ${order.gameUserId}.`, "success");
        await notifyReceipt({
          contact: order.contact,
          subject: `Pesanan ${order.invoiceNo} Berhasil`,
          body: `<p>Halo,</p><p>Pesanan <b>${snap.itemName ?? "item"}</b> (${snap.gameName ?? ""}) untuk ID <b>${order.gameUserId}</b> telah berhasil dikirim.</p><p>Total: ${formatRupiah(order.amount)}</p>`,
          wa: `NexusTop: Pesanan ${order.invoiceNo} BERHASIL. ${snap.itemName ?? "Item"} sudah dikirim ke ID ${order.gameUserId}. Terima kasih!`,
        });
      }
    } else if (deliv.status === "failed") {
      await db
        .update(orders)
        .set({ deliveryStatus: "failed", status: "failed", failureReason: deliv.message ?? "Gagal mengirim item", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      await notifyOrderFailed({ invoiceNo: order.invoiceNo, reason: deliv.message ?? "Gagal mengirim item" });
      if (order.userId) {
        await addNotification(order.userId, "Pesanan Gagal", `Pengiriman untuk ${order.invoiceNo} gagal: ${deliv.message ?? ""}`, "warning");
      }
    }
  }
  return getOrder(orderId);
}

/** Drive a deposit to completion: verify payment then credit the wallet. */
export async function finalizeDeposit(depositId: string) {
  const rows = await db.select().from(deposits).where(eq(deposits.id, depositId)).limit(1);
  let dep = rows[0];
  if (!dep) throw new Error("Deposit tidak ditemukan");
  if (dep.status !== "pending") return dep;

  const ps = await getPaymentStatus(dep.invoiceNo);
  if (ps.status === "success") {
    await db.update(deposits).set({ status: "success", updatedAt: new Date() }).where(eq(deposits.id, depositId));
    await adjustWallet(dep.userId, dep.amount, "deposit", `Deposit ${dep.invoiceNo}`, dep.invoiceNo);
    await recordSuccessfulSpend(dep.userId, dep.amount, dep.invoiceNo);
    await addNotification(dep.userId, "Deposit Berhasil", `Saldo ${formatRupiah(dep.amount)} telah masuk ke dompet Anda.`, "success");
    await notifyDepositSuccess({ invoiceNo: dep.invoiceNo, amount: dep.amount, userName: dep.userId });
    const user = (await db.select().from(deposits).where(eq(deposits.id, depositId)).limit(1))[0];
    await notifyReceipt({
      contact: dep.invoiceNo,
      subject: `Deposit ${dep.invoiceNo} Berhasil`,
      body: `<p>Deposit sebesar <b>${formatRupiah(dep.amount)}</b> berhasil. Saldo dompet Anda telah bertambah.</p>`,
      wa: `NexusTop: Deposit ${formatRupiah(dep.amount)} BERHASIL masuk ke dompet Anda.`,
    });
    dep = user!;
  } else if (ps.status === "failed") {
    await db.update(deposits).set({ status: "failed", updatedAt: new Date() }).where(eq(deposits.id, depositId));
    dep = (await db.select().from(deposits).where(eq(deposits.id, depositId)).limit(1))[0]!;
  }
  return dep;
}
