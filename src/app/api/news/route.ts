import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { news } from "@/db/schema";
import { getSecret } from "@/lib/secrets";

export const dynamic = "force-dynamic";

async function checkAdmin(req: Request): Promise<boolean> {
  const adminKey = await getSecret("ADMIN_API_KEY");
  const provided = req.headers.get("x-admin-key");
  return Boolean(adminKey && provided === adminKey);
}

// List all news (including unpublished) for admin
export async function GET() {
  const rows = await db.select().from(news).orderBy(eq(news.pinned, true));
  return Response.json({ news: rows });
}

const schema = z.object({
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  imageUrl: z.string().optional(),
  category: z.string().default("Info"),
  isPublished: z.boolean().default(true),
  pinned: z.boolean().default(false),
});

// Create a news article (admin only)
export async function POST(req: Request) {
  if (!(await checkAdmin(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Data tidak valid." }, { status: 400 });
  const [row] = await db.insert(news).values(parsed.data).returning();
  return Response.json({ news: row });
}

// Update / delete via PATCH and DELETE
export async function PATCH(req: Request) {
  if (!(await checkAdmin(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { id, ...patch } = body;
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });
  const [row] = await db.update(news).set({ ...patch, updatedAt: new Date() }).where(eq(news.id, id)).returning();
  return Response.json({ news: row });
}

export async function DELETE(req: Request) {
  if (!(await checkAdmin(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });
  await db.delete(news).where(eq(news.id, id));
  return Response.json({ ok: true });
}
