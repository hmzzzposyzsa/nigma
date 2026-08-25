import { getRawSetting, setSetting } from "./settings";

/**
 * Server-side secret management.
 *
 * All third-party API keys live in the `settings` table so the (separately
 * hosted) admin panel can configure them by writing to the shared database — no
 * redeploy, no env editing. This layer resolves each key with this priority:
 *
 *   1. settings table (DB)   — admin-managed value
 *   2. environment variable  — bootstrap / CI fallback
 *   3. def.fallback          — sane default (e.g. Midtrans sandbox URLs)
 *
 * CRITICAL: secrets are server-side only. `getSecret` is never imported by any
 * client component and is never returned to the browser. The status endpoint
 * exposes only which keys are *configured* (+ a masked hint), never raw values.
 *
 * Infrastructure keys that cannot live in the DB stay in env:
 *   - DATABASE_URL       (key to reach the database itself)
 *   - SESSION_SECRET     (signs every auth cookie; read per request)
 *   - SUPABASE_*         (needed to connect to the Supabase project)
 */

export type SecretName =
  | "OPENROUTER_API_KEY"
  | "APIGAMES_MERCHANT_ID"
  | "APIGAMES_SECRET"
  | "SEKALIPAY_API_KEY"
  | "MIDTRANS_SERVER_KEY"
  | "MIDTRANS_SNAP_URL"
  | "MIDTRANS_STATUS_URL"
  | "RESEND_API_KEY"
  | "RESEND_FROM"
  | "FONNTE_TOKEN"
  | "TELEGRAM_BOT_TOKEN"
  | "TELEGRAM_CHAT_ID"
  | "ADMIN_API_KEY";

export type SecretDef = {
  name: SecretName;
  key: string; // settings table key
  env: string; // env var fallback
  label: string;
  category: string;
  required?: boolean;
  fallback?: string; // default if neither DB nor env set
  secret?: boolean; // mask in status (true for credentials)
};

export const SECRET_DEFS: SecretDef[] = [
  { name: "OPENROUTER_API_KEY", key: "secret_openrouter_api_key", env: "OPENROUTER_API_KEY", label: "OpenRouter API Key", category: "AI / Chatbot", required: true, secret: true },
  { name: "APIGAMES_MERCHANT_ID", key: "secret_apigames_merchant_id", env: "APIGAMES_MERCHANT_ID", label: "ApiGames Merchant ID", category: "Game Catalog" },
  { name: "APIGAMES_SECRET", key: "secret_apigames_secret", env: "APIGAMES_SECRET", label: "ApiGames Secret (Signature)", category: "Game Catalog", secret: true },
  { name: "SEKALIPAY_API_KEY", key: "secret_sekalipay_api_key", env: "SEKALIPAY_API_KEY", label: "SekaliPay API Key", category: "Game Catalog", secret: true },
  { name: "MIDTRANS_SERVER_KEY", key: "secret_midtrans_server_key", env: "MIDTRANS_SERVER_KEY", label: "Midtrans Server Key", category: "Payment", required: true, secret: true },
  { name: "MIDTRANS_SNAP_URL", key: "secret_midtrans_snap_url", env: "MIDTRANS_SNAP_URL", label: "Midtrans Snap URL", category: "Payment", fallback: "https://app.sandbox.midtrans.com/snap/v1/transactions" },
  { name: "MIDTRANS_STATUS_URL", key: "secret_midtrans_status_url", env: "MIDTRANS_STATUS_URL", label: "Midtrans Status URL", category: "Payment", fallback: "https://api.sandbox.midtrans.com/v2" },
  { name: "RESEND_API_KEY", key: "secret_resend_api_key", env: "RESEND_API_KEY", label: "Resend API Key", category: "Notifications", secret: true },
  { name: "RESEND_FROM", key: "secret_resend_from", env: "RESEND_FROM", label: "Resend From Address", category: "Notifications", fallback: "NexusTop <noreply@nexustop.id>" },
  { name: "FONNTE_TOKEN", key: "secret_fonnte_token", env: "FONNTE_TOKEN", label: "Fonnte WhatsApp Token", category: "Notifications", secret: true },
  { name: "TELEGRAM_BOT_TOKEN", key: "secret_telegram_bot_token", env: "TELEGRAM_BOT_TOKEN", label: "Telegram Bot Token", category: "Notifications", secret: true },
  { name: "TELEGRAM_CHAT_ID", key: "secret_telegram_chat_id", env: "TELEGRAM_CHAT_ID", label: "Telegram Chat ID", category: "Notifications" },
  { name: "ADMIN_API_KEY", key: "secret_admin_api_key", env: "ADMIN_API_KEY", label: "Admin API Key (for manual delivery)", category: "Admin", secret: true },
];

const byName = Object.fromEntries(SECRET_DEFS.map((d) => [d.name, d])) as Record<SecretName, SecretDef>;

/** Resolve a secret value (DB → env → fallback). Server-side only. */
export async function getSecret(name: SecretName): Promise<string | undefined> {
  const def = byName[name];
  const dbVal = await getRawSetting(def.key);
  if (dbVal && dbVal.trim()) return dbVal;
  const envVal = process.env[def.env];
  if (envVal && envVal.trim()) return envVal;
  return def.fallback;
}

/** True when a real value exists in DB or env (excludes pure fallbacks). */
export async function isSecretConfigured(name: SecretName): Promise<boolean> {
  const def = byName[name];
  const dbVal = await getRawSetting(def.key);
  if (dbVal && dbVal.trim()) return true;
  const envVal = process.env[def.env];
  return Boolean(envVal && envVal.trim());
}

function mask(v: string): string {
  if (v.length <= 4) return "•".repeat(v.length);
  return "•".repeat(Math.min(16, v.length - 4)) + v.slice(-4);
}

export type SecretStatus = {
  name: SecretName;
  key: string;
  label: string;
  category: string;
  required: boolean;
  configured: boolean;
  source: "database" | "env" | "default" | "missing";
  hint: string | null;
};

/** Safe summary for status pages — never exposes raw credential values. */
export async function getSecretStatus(): Promise<SecretStatus[]> {
  const out: SecretStatus[] = [];
  for (const def of SECRET_DEFS) {
    const dbVal = await getRawSetting(def.key);
    const hasDb = Boolean(dbVal && dbVal.trim());
    const envVal = process.env[def.env];
    const hasEnv = Boolean(envVal && envVal.trim());
    const value = await getSecret(def.name);
    const source: SecretStatus["source"] = hasDb ? "database" : hasEnv ? "env" : value ? "default" : "missing";

    let hint: string | null = null;
    if (value) hint = def.secret ? mask(value) : value;

    out.push({
      name: def.name,
      key: def.key,
      label: def.label,
      category: def.category,
      required: Boolean(def.required),
      configured: hasDb || hasEnv,
      source,
      hint,
    });
  }
  return out;
}

/** Persist secret values (admin only). `values` maps SecretName -> raw string. */
export async function setSecrets(values: Record<string, string>): Promise<string[]> {
  const allowed = new Set(SECRET_DEFS.map((d) => d.name));
  const updated: string[] = [];
  for (const [name, value] of Object.entries(values)) {
    if (!allowed.has(name as SecretName) || typeof value !== "string") continue;
    await setSetting(byName[name as SecretName].key, value);
    updated.push(name);
  }
  return updated;
}
