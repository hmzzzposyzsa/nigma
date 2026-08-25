import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders, creditTransactions, vouchers, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { tierProgress, retentionShortfall, tierDiscountLabel } from "@/lib/tiers";
import { TIERS } from "@/lib/constants";
import { daysUntilMonthEnd, formatRupiah, formatDate } from "@/lib/format";
import { Container, Card, Badge, Button, cn } from "@/components/ui";
import { Crown, Wallet, Sparkles, Ticket, Bell, TrendingUp, ShieldAlert, ChevronRight, Dice5, Gift } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const [recentOrders, creditTx, userVouchers, unreadNotifs] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(8),
    db.select().from(creditTransactions).where(eq(creditTransactions.userId, user.id)).orderBy(desc(creditTransactions.createdAt)).limit(8),
    db
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.userId, user.id), eq(vouchers.isUsed, false)))
      .limit(5),
    db.select().from(notifications).where(and(eq(notifications.userId, user.id), eq(notifications.read, false))).limit(5),
  ]);

  const progress = tierProgress(user);
  const shortfall = retentionShortfall(user.role, user.monthlySpend);
  const days = daysUntilMonthEnd();
  const isTiered = user.role === "langganan" || user.role === "sultan";
  const validVouchers = userVouchers.filter((v) => !v.expiresAt || v.expiresAt > new Date());

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Akun Saya</h1>
          <p className="text-sm text-muted-foreground">Selamat datang kembali, {user.name}.</p>
        </div>
        <div className="flex gap-2">
          <Button href="/balance" variant="outline" size="sm"><Wallet size={15} /> Deposit</Button>
          <Button href="/event" size="sm"><Dice5 size={15} /> Event</Button>
        </div>
      </div>

      {/* Retention banner */}
      {isTiered && shortfall > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-gold" />
          <div className="text-sm">
            <p className="font-bold">Tier {TIERS[user.role as keyof typeof TIERS].label} kamu berisiko turun bulan depan.</p>
            <p className="text-muted-foreground">
              Belanja <span className="font-bold text-foreground">{formatRupiah(shortfall)}</span> lagi dalam <span className="font-bold text-foreground">{days} hari</span> untuk mempertahankan tier dan diskon eksklusif kamu.
            </p>
          </div>
          <Button href="/products" size="sm" className="ml-auto shrink-0">Top Up</Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile + balance */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">{user.name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate font-bold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email ?? user.phone}</p>
              <Badge tone={user.role === "sultan" ? "gold" : user.role === "langganan" ? "primary" : "muted"} className="mt-1">
                {user.role === "sultan" && <Crown size={12} />} Tier {TIERS[user.role as keyof typeof TIERS].label}
              </Badge>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniStat label="Saldo Dompet" value={formatRupiah(user.balance)} icon={<Wallet size={14} />} />
            <MiniStat label="Spin Credit" value={String(user.creditBalance)} icon={<Sparkles size={14} />} />
            <MiniStat label="Belanja Bulan Ini" value={formatRupiah(user.monthlySpend)} icon={<TrendingUp size={14} />} />
            <MiniStat label="Total Belanja" value={formatRupiah(user.totalSpend)} icon={<TrendingUp size={14} />} />
          </div>
        </Card>

        {/* Tier progress */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Progress Tier Member</h3>
            <Badge tone="primary">{tierDiscountLabel(user.role)}</Badge>
          </div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Pemula</span>
            <span>Langganan</span>
            <span>Sultan</span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-muted">
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${user.role === "sultan" ? 100 : user.role === "langganan" ? 55 : Math.min(50, progress.progress * 50)}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {progress.nextRole ? (
              <>Belanja <span className="font-bold text-foreground">{formatRupiah(progress.remaining)}</span> lagi untuk naik ke tier <span className="font-bold text-primary">{TIERS[progress.nextRole].label}</span>.</>
            ) : (
              <>Kamu berada di tier tertinggi <span className="font-bold text-gold">Sultan</span>. Nikmati diskon terbesar & akses event eksklusif!</>
            )}
          </p>
          {isTiered && (
            <Button href="/hadiah" variant="outline" size="sm" className="mt-3"><Gift size={15} /> Buka Hadiah Eksklusif</Button>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Orders */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Riwayat Pesanan</h3>
            <Link href="/products" className="text-xs font-semibold text-primary hover:underline">Top Up Lagi</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pesanan. <Link href="/products" className="text-primary">Mulai top-up</Link>.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-center justify-between py-2.5 transition hover:bg-muted/50 -mx-2 px-2 rounded-lg">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{o.snapshot ? `${(o.snapshot as any).itemName}` : "Pesanan"} · {formatRupiah(o.amount)}</p>
                      <p className="truncate text-xs text-muted-foreground">{o.invoiceNo} · {formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={o.status === "delivered" ? "success" : o.status === "failed" ? "danger" : "primary"}>{o.status}</Badge>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Vouchers + notifications */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><Ticket size={16} /> Voucher Saya</h3>
            {validVouchers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada voucher. Menang di Event Roulette untuk dapat voucher!</p>
            ) : (
              <ul className="space-y-2">
                {validVouchers.map((v) => (
                  <li key={v.id} className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-2.5">
                    <p className="font-mono text-sm font-bold text-primary">{v.code}</p>
                    <p className="text-xs text-muted-foreground">{v.discountType === "percentage" ? `Diskon ${v.discountValue}%` : `Potong ${formatRupiah(v.discountValue)}`}{v.maxDiscount ? ` (maks ${formatRupiah(v.maxDiscount)})` : ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><Bell size={16} /> Notifikasi</h3>
            {unreadNotifs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi baru.</p>
            ) : (
              <ul className="space-y-2.5">
                {unreadNotifs.map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Credit history */}
      <Card className="mt-4 p-5">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><Sparkles size={16} /> Riwayat Spin Credit</h3>
        {creditTx.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada aktivitas kredit.</p>
        ) : (
          <ul className="divide-y divide-border">
            {creditTx.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold capitalize">{t.description ?? t.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                </div>
                <span className={cn("text-sm font-bold", t.delta >= 0 ? "text-success" : "text-danger")}>{t.delta >= 0 ? "+" : ""}{t.delta}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-2.5">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">{icon} {label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
