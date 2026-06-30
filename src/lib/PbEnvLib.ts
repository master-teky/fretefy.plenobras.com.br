import { z } from "zod/v4";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalString = () =>
  z.preprocess(emptyToUndefined, z.string().min(1).optional());

const optionalUrl = () =>
  z.preprocess(emptyToUndefined, z.url().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_BASE_URL: z.url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.url(),

  // Auth
  AUTH_API_URL: z.string().min(1),
  AUTH_API_PORT: z.string().min(1),

  // Database (SQL Server)
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().default("1433"),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // Fretefy API
  FRETEFY_API_URL: z.url(),
  FRETEFY_API_KEY: z.string().min(1),

  // Dados da empresa (Plenobras)
  PLENOBRAS_UNIDADE_NEGOCIO_ID: z.guid(),
  PLENOBRAS_DOCUMENTO: z.string().min(1),
  PLENOBRAS_RAZAO_SOCIAL: z.string().min(1),
  PLENOBRAS_ENDERECO: z.string().min(1),
  PLENOBRAS_CIDADE: z.string().min(1),
  PLENOBRAS_UF: z.string().length(2),

  // Webhooks
  WEBHOOK_SECRET: z.string().min(1),

  // Dkron (optional — only required when dkron service is enabled)
  DKRON_URL: optionalUrl(),
  CRON_SECRET: optionalString(),

  // Sync schedule
  SYNC_CRON: z.string().default("0 0 */6 * * *"),
  SYNC_TRACKS_CRON: z.string().default("0 */2 * * * *"),
  CACHE_FRETEFY_TYPES_CRON: z.string().default("0 0 5 * * *"),

  // AWS S3
  AWS_REGION: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  // REDIS
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().default(6379)
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