import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, games, vouchers, flashSales } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { marginFor, sellPrice } from "@/lib/tiers";
import { createPayment } from "@/lib/integrations";
import { deductWallet } from "@/lib/ledger";
import { advanceOrder } from "@/lib/payments";
import { genInvoice } from "@/lib/format";
import { getActiveFlashSaleForProduct, applyDiscount } from "@/lib/queries";
import { notifyOrderCreated } from "@/lib/telegram";

const schema = z.object({
  gameId: z.string().uuid(),
  productId: z.string().uuid(),
  gameUserId: z.string().min(3).max(40),
  serverId: z.string().max(20).optional(),
  contact: z.string().min(5).max(60),
  paymentMethod: z.string().min(1),
  useBalance: z.boolean().optional(),
  voucherCode: z.string().max(20).optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const list = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(30);
  return Response.json({ orders: list });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Data pesanan tidak valid." }, { status: 400 });
  const data = parsed.data;

  const user = await getCurrentUser();
  const role = (user?.role as string) ?? "pemula";

  const game = (await db.select().from(games).where(and(eq(games.id, data.gameId), eq(games.isActive, true))).limit(1))[0];
  const product = (
    await db
      .select()
      .from(products)
      .where(and(eq(products.id, data.productId), eq(products.gameId, data.gameId), eq(products.isActive, true)))
      .limit(1)
  )[0];
  if (!game || !product) return Response.json({ error: "Produk tidak ditemukan." }, { status: 404 });

  const margin = marginFor(role);
  let amount = sellPrice(product.costPrice, role);

  // Flash sale discount (system-checked time window + stock).
  const sale = await getActiveFlashSaleForProduct(product.id);
  if (sale) {
    amount = applyDiscount(amount, sale.discountType, sale.discountValue);
    await db
      .update(flashSales)
      .set({ soldCount: sql`${flashSales.soldCount} + 1` })
      .where(eq(flashSales.id, sale.id));
  }

  // Optional voucher
  let appliedVoucher: string | null = null;
  if (user && data.voucherCode) {
    const v = (
      await db
        .select()
        .from(vouchers)
        .where(and(eq(vouchers.code, data.voucherCode.toUpperCase()), eq(vouchers.userId, user.id)))
        .limit(1)
    )[0];
    if (v && !v.isUsed && (!v.expiresAt || v.expiresAt > new Date())) {
      const discount = v.discountType === "percentage" ? Math.min(v.maxDiscount, Math.round((amount * v.discountValue) / 100)) : v.discountValue;
      amount = Math.max(0, amount - discount);
      appliedVoucher = v.code;
    }
  }

  const invoiceNo = genInvoice("INV");
  const snapshot = {
    gameName: game.name,
    publisher: game.publisher,
    gameImage: game.imageUrl,
    itemName: product.itemName,
    denomination: product.denomination,
    sku: product.sku,
    gameCode: (game as unknown as { code?: string }).code,
  };

  // Method B — pay with wallet balance
  if (data.useBalance) {
    if (!user) return Response.json({ error: "Masuk untuk membayar dengan saldo." }, { status: 401 });
    if (user.balance < amount) {
      return Response.json({ error: `Saldo tidak cukup. Saldo kamu ${user.balance}.`, balance: user.balance }, { status: 402 });
    }
    const [order] = await db
      .insert(orders)
      .values({
        invoiceNo,
        userId: user.id,
        gameId: game.id,
        productId: product.id,
        gameUserId: data.gameUserId,
        serverId: data.serverId || null,
        contact: data.contact,
        paymentMethod: "balance",
        paidWithBalance: true,
        basePrice: product.costPrice,
        marginPct: margin.toFixed(4),
        amount,
        status: "processing",
        paymentStatus: "success",
        snapshot,
      })
      .returning();
    await deductWallet(user.id, amount, "purchase", `Pembelian ${product.itemName}`, invoiceNo);
    if (appliedVoucher) await db.update(vouchers).set({ isUsed: true }).where(eq(vouchers.code, appliedVoucher));
    await advanceOrder(order.id);
    await notifyOrderCreated({
      invoiceNo: order.invoiceNo,
      itemName: product.itemName,
      gameName: game.name,
      amount,
      gameUserId: data.gameUserId,
      paymentMethod: "Saldo Dompet",
      deliveryMethod: product.deliveryMethod ?? "provider",
    });
    return Response.json({ order, instructions: null });
  }

  // Method A — payment gateway
  const payment = await createPayment({
    invoiceNo,
    amount,
    method: data.paymentMethod,
    customerName: user?.name,
    customerEmail: data.contact.includes("@") ? data.contact : undefined,
    customerPhone: data.contact.includes("@") ? undefined : data.contact,
    itemName: `${product.itemName} (${game.name})`,
  });

  const [order] = await db
    .insert(orders)
    .values({
      invoiceNo,
      userId: user?.id ?? null,
      gameId: game.id,
      productId: product.id,
      gameUserId: data.gameUserId,
      serverId: data.serverId || null,
      contact: data.contact,
      paymentMethod: data.paymentMethod,
      paidWithBalance: false,
      basePrice: product.costPrice,
      marginPct: margin.toFixed(4),
      amount,
      status: "pending",
      paymentStatus: "pending",
      providerTrxId: payment.providerTrxId,
      snapshot: { ...snapshot, instructions: payment },
    })
    .returning();

  if (appliedVoucher) await db.update(vouchers).set({ isUsed: true }).where(eq(vouchers.code, appliedVoucher));

  await notifyOrderCreated({
    invoiceNo: order.invoiceNo,
    itemName: product.itemName,
    gameName: game.name,
    amount,
    gameUserId: data.gameUserId,
    paymentMethod: data.paymentMethod,
    deliveryMethod: product.deliveryMethod ?? "provider",
  });
  return Response.json({ order, instructions: payment });
}
