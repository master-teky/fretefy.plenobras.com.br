import { z } from "zod/v4";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalString = () =>
  z.preprocess(emptyToUndefined, z.string().min(1).optional());

const optionalUrl = () =>
  z.preprocess(emptyToUndefined, z.string().url().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_BASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),

  // Auth
  AUTH_API_URL: z.string().min(1),
  AUTH_API_PORT: z.string().min(1),

  // ERP Database (read-only)
  ERP_DB_HOST: z.string().min(1),
  ERP_DB_PORT: z.string().default("1433"),
  ERP_DB_USER: z.string().min(1),
  ERP_DB_PASSWORD: z.string().min(1),
  ERP_DB_NAME: z.string().min(1),

  // App Database (read-write) — Fase 1: desabilitado, preencher quando o servidor próprio for provisionado
  APP_DB_HOST: optionalString(),
  APP_DB_PORT: z.string().default("1436"),
  APP_DB_USER: optionalString(),
  APP_DB_PASSWORD: optionalString(),
  APP_DB_NAME: optionalString(),

  // Fretefy API
  FRETEFY_API_URL: z.string().url(),
  FRETEFY_API_KEY: z.string().min(1),

  // Webhooks
  WEBHOOK_SECRET: z.string().min(1),

  // Dkron (optional — only required when dkron service is enabled)
  DKRON_URL: optionalUrl(),
  CRON_SECRET: optionalString(),

  // Sync schedule
  SYNC_CRON: z.string().default("0 */6 * * *"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function getEnv(): Env {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}

// For backward compatibility
export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});