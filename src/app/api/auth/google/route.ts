import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { setSessionCookie } from "@/lib/auth";

/**
 * Google OAuth entry point.
 * In production this triggers Supabase Auth's Google provider (OAuth redirect).
 * In this sandbox (no Supabase project configured) it signs the visitor into a
 * demo Google account so the social-login button is fully functional end-to-end.
 */
export async function GET() {
  const email = "google.demo@nexustop.id";
  let user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        name: "Pengguna Google",
        email,
        oauthProvider: "google",
        oauthSubject: "google-demo-001",
        role: "pemula",
      })
      .returning();
  }
  await setSessionCookie(user);
  return Response.redirect(new URL("/account", req_url()));
}

function req_url() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
