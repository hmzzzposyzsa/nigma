import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Masukkan email/HP dan kata sandi." }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.phone, identifier)))
    .limit(1);
  const user = rows[0];
  if (!user || !user.passwordHash) {
    return Response.json({ error: "Akun tidak ditemukan. Periksa email/HP kamu." }, { status: 404 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return Response.json({ error: "Kata sandi salah." }, { status: 401 });
  }

  await setSessionCookie(user);
  return Response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
