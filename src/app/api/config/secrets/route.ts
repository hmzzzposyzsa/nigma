import { getSecretStatus } from "@/lib/secrets";

export const dynamic = "force-dynamic";

/**
 * Safe, read-only configuration status. Returns which integration keys are
 * configured and where they come from (database / env / default / missing),
 * plus a MASKED hint. Raw secret values are NEVER returned.
 *
 * Keys are managed directly in the Supabase `settings` table (or the
 * separately-hosted admin panel), so there is no write endpoint here.
 */
export async function GET() {
  const status = await getSecretStatus();
  return Response.json({ secrets: status });
}
