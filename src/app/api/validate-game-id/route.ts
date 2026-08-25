import { z } from "zod";
import { validateGameId } from "@/lib/integrations";

const schema = z.object({
  gameCode: z.string().optional(),
  gameSlug: z.string().optional(),
  userId: z.string().min(1).max(40),
  serverId: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Input tidak valid." }, { status: 400 });
  const result = await validateGameId(parsed.data);
  return Response.json(result);
}
