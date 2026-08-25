import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY Supabase service-role client (OPTIONAL utility).
 *
 * This app does NOT need the service role key for its normal operation:
 *   - READS  use the public anon key (src/lib/supabase-browser.ts) + RLS.
 *   - WRITES go through Drizzle via DATABASE_URL, which bypasses RLS.
 *
 * The service role key is only required by the SEPARATELY-HOSTED admin panel.
 * This module is kept as a ready, server-only utility for any privileged
 * server-side Supabase operation (and to document where the service key would
 * be used). It is never imported by client code — `import "server-only"` makes
 * any such import a hard build error.
 *
 * The key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS, so it must NEVER be prefixed
 * with NEXT_PUBLIC_ and must never reach the browser.
 */

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const USE_SUPABASE_SERVICE = Boolean(url && serviceKey);

export const supabase: SupabaseClient | null =
  USE_SUPABASE_SERVICE && url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;
