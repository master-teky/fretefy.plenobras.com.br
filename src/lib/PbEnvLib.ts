import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_BASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),

  // Auth
  AUTH_API_URL: z.string().min(1),
  AUTH_API_PORT: z.string().min(1),

  // ERP Database
  ERP_DB_HOST: z.string().min(1),
  ERP_DB_PORT: z.string().default("1433"),
  ERP_DB_USER: z.string().min(1),
  ERP_DB_PASSWORD: z.string().min(1),
  ERP_DB_NAME: z.string().min(1),

  // Fretefy API
  FRETEFY_API_URL: z.string().url(),
  FRETEFY_API_KEY: z.string().min(1),

  // Webhooks
  WEBHOOK_SECRET: z.string().min(1),

  // Dkron
  DKRON_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),

  // Sync schedules
  SYNC_MOTORISTAS_CRON: z.string().default("0 */6 * * *"),
  SYNC_VEICULOS_CRON: z.string().default("0 */6 * * *"),
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