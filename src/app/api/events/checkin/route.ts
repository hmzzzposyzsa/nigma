import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { grantCredits } from "@/lib/ledger";

export async function POST() {
  const user = await requireUser();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  if (user.lastCheckIn === todayStr) {
    return Response.json({ ok: false, streak: user.streakDays, message: "Kamu sudah check-in hari ini. Kembali besok!" });
  }
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  const yStr = y.toISOString().slice(0, 10);
  const streak = user.lastCheckIn === yStr ? user.streakDays + 1 : 1;

  let granted = 0;
  if (streak === 7) granted = 1;
  else if (streak === 14) granted = 2;
  else if (streak === 30) granted = 5;

  await db.update(users).set({ lastCheckIn: todayStr, streakDays: streak }).where(eq(users.id, user.id));
  if (granted > 0) await grantCredits(user.id, granted, "event_reward", `Bonus streak check-in hari ke-${streak}`, "checkin");

  return Response.json({
    ok: true,
    streak,
    granted,
    message: granted > 0 ? `Streak ${streak} hari! Kamu dapat +${granted} Spin Credit.` : `Check-in berhasil! Streak ${streak} hari.`,
  });
}
