import { drizzle } from "drizzle-orm/node-mssql";
import * as sql from "mssql";
import * as motorista from "./schema/motorista";
import * as veiculo from "./schema/veiculo";
import { env } from "@/lib/env";

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

export const db = drizzle(pool, {
  schema: { ...motorista, ...veiculo },
});