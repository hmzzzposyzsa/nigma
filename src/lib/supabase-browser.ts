import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * PUBLIC (anon) Supabase client — safe for the browser / frontend.
 *
 * The anon key is DESIGNED to be public. It is only safe because Row Level
 * Security (RLS — see supabase/rls.sql) locks it to READ-ONLY access on public
 * catalog tables (games, products, banners, flash_sales, events). With RLS in
 * place the anon key can NEVER insert/update/delete anything and can NEVER read
 * private tables (users, orders, deposits, credits).
 *
 *   Frontend (reads)  → anon key + RLS  (this module)
 *   Backend (writes)  → Drizzle / DATABASE_URL (bypasses RLS, server-only)
 *
 * This module intentionally has NO `server-only` guard and uses NEXT_PUBLIC_*
 * vars, so client components may import it for direct frontend reads.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when a Supabase project URL + anon key are configured for frontend reads. */
export const USE_SUPABASE = Boolean(url && anonKey);

/** Read-only anon client (RLS-protected). Null when Supabase isn't configured. */
export const supabaseBrowser: SupabaseClient | null =
  USE_SUPABASE && url && anonKey ? createClient(url, anonKey) : null;
