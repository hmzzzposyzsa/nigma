import { eq } from "drizzle-orm";
import { db } from "@/db";
import { deposits } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { finalizeDeposit } from "@/lib/payments";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const dep = (await db.select().from(deposits).where(eq(deposits.id, id)).limit(1))[0];
  if (!dep) return Response.json({ error: "Deposit tidak ditemukan" }, { status: 404 });
  if (dep.userId !== user.id) return Response.json({ error: "Akses ditolak" }, { status: 403 });

  const updated = await finalizeDeposit(id);
  return Response.json({ deposit: updated });
}
