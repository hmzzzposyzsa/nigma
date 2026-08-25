import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deposits } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { createPayment } from "@/lib/integrations";
import { genInvoice } from "@/lib/format";

const schema = z.object({
  amount: z.number().int().min(10000).max(50_000_000),
  paymentMethod: z.string().min(1),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const list = await db
    .select()
    .from(deposits)
    .where(eq(deposits.userId, user.id))
    .orderBy(desc(deposits.createdAt))
    .limit(30);
  return Response.json({ deposits: list });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Jumlah deposit minimal Rp10.000." }, { status: 400 });

  const invoiceNo = genInvoice("DEP");
  const payment = await createPayment({
    invoiceNo,
    amount: parsed.data.amount,
    method: parsed.data.paymentMethod,
    customerName: user.name,
    customerEmail: user.email ?? undefined,
    customerPhone: user.phone ?? undefined,
    itemName: `Deposit Saldo NexusTop`,
  });

  const [deposit] = await db
    .insert(deposits)
    .values({
      invoiceNo,
      userId: user.id,
      amount: parsed.data.amount,
      paymentMethod: parsed.data.paymentMethod,
      status: "pending",
      vaNumber: payment.vaNumber,
      vaBank: payment.vaBank,
      qrString: payment.qrString,
      deeplinkUrl: payment.deeplinkUrl,
      providerTrxId: payment.providerTrxId,
    })
    .returning();

  return Response.json({ deposit, instructions: payment });
}
