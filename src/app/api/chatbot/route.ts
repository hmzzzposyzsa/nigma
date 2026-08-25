import { z } from "zod";
import { customerChat, type ChatMessage } from "@/lib/openrouter";

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() }))
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Pesan tidak valid." }, { status: 400 });
  }
  const history = parsed.data.messages
    .filter((m) => m.role !== "system")
    .slice(-12) as ChatMessage[];
  const reply = await customerChat(history);
  return Response.json({ reply });
}
