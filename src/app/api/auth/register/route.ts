import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { notifyNewUser } from "@/lib/telegram";

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Data tidak valid. Periksa kembali isian kamu." }, { status: 400 });
  }
  const { name, email, phone, password } = parsed.data;
  if (!email && !phone) {
    return Response.json({ error: "Masukkan email atau nomor HP." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email ?? "__none__"), eq(users.phone, phone ?? "__none__")))
    .limit(1);
  if (existing[0]) {
    return Response.json({ error: "Email atau nomor HP sudah terdaftar. Silakan masuk." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ name, email: email ?? null, phone: phone ?? null, passwordHash, role: "pemula" })
    .returning();

  await setSessionCookie(user);
  await notifyNewUser({ name: user.name, email: user.email, phone: user.phone });
  return Response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
