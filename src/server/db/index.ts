import { drizzle } from "drizzle-orm/node-mssql";
import * as sql from "mssql";
import * as driver from "./schema/driver";
import * as vehicle from "./schema/vehicle";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
const schema = { ...driver, ...vehicle };

let _db: DrizzleDb | undefined;

export function getDb(): DrizzleDb {
  if (!_db) {
    const { env } = require("@/lib/env") as { env: import("@/lib/env").Env };
    const pool = new sql.ConnectionPool({
      server: env.ERP_DB_HOST,
      port: Number(env.ERP_DB_PORT),
      user: env.ERP_DB_USER,
      password: env.ERP_DB_PASSWORD,
      database: env.ERP_DB_NAME,
      options: {
        trustServerCertificate: true,
      },
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});