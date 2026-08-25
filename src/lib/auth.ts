import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const COOKIE_NAME = "nx_session";
const ALG = "HS256";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "nexus-top-dev-secret-please-override-in-production-2026"
);

export type SessionPayload = {
  sub: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
};

export function getCookieName() {
  return COOKIE_NAME;
}

export async function signSession(u: Pick<User, "id" | "name" | "email" | "phone" | "role">) {
  return new SignJWT({
    sub: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function readSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Always returns the freshest user row from the DB, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await readSession();
  if (!session?.sub) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.sub)).limit(1);
  return rows[0] ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401, statusText: "Unauthorized" });
  }
  return user;
}

export async function setSessionCookie(u: Pick<User, "id" | "name" | "email" | "phone" | "role">) {
  const token = await signSession(u);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
}
