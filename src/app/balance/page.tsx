import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { deposits, walletTransactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { DepositClient } from "@/components/DepositClient";
import { Container } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/balance");

  const recentDeposits = await db
    .select()
    .from(deposits)
    .where(eq(deposits.userId, user.id))
    .orderBy(desc(deposits.createdAt))
    .limit(10);
  const walletTx = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, user.id))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(10);

  return (
    <Container className="py-8">
      <DepositClient
        balance={user.balance}
        name={user.name}
        recentDeposits={recentDeposits.map((d) => ({ id: d.id, invoiceNo: d.invoiceNo, amount: d.amount, status: d.status, method: d.paymentMethod, createdAt: d.createdAt.toISOString() }))}
        walletTx={walletTx.map((t) => ({ id: t.id, type: t.type, delta: t.delta, description: t.description, createdAt: t.createdAt.toISOString() }))}
      />
    </Container>
  );
}
