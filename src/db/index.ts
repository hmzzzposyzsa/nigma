import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Lazy database client.
 *
 * IMPORTANT: this module MUST NOT touch `process.env.DATABASE_URL` or create a
 * pool at import time. During a hosting build (Vercel/Cloudflare) the env vars
 * may not be present, and Next imports this module while collecting page data.
 * A top-level throw here would break the whole build (even for /_not-found).
 *
 * So we defer everything to the first real query: `db` is a Proxy that resolves
 * the pool + Drizzle instance lazily and only then throws if the connection
 * string is missing. Builds without DATABASE_URL succeed; runtime requests
 * require it (your Supabase Postgres connection string).
 */

type DbClient = ReturnType<typeof drizzle>;

const globalForDb = globalThis as typeof globalThis & {
  __nxPool?: Pool;
};

let client: DbClient | undefined;

function resolveDb(): DbClient {
  if (client) return client;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Set it to your database connection string (e.g. your Supabase Postgres URL) in the deployment environment."
    );
  }
  const pool = globalForDb.__nxPool ?? new Pool({ connectionString: databaseUrl });
  globalForDb.__nxPool = pool; // reuse the pool across hot reloads in dev
  client = drizzle(pool);
  return client;
}

export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    const instance = resolveDb();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
}) as DbClient;
