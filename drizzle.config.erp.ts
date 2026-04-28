import { defineConfig } from "drizzle-kit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineConfig({
  dialect: "mssql" as any,
  schema: "./src/server/db/erp/schema",
  // MSSQL credentials — types not yet in stable drizzle-kit, cast to bypass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbCredentials: {
    server: process.env.ERP_DB_HOST!,
    port: Number(process.env.ERP_DB_PORT || "1433"),
    user: process.env.ERP_DB_USER!,
    password: process.env.ERP_DB_PASSWORD!,
    database: process.env.ERP_DB_NAME!,
    options: {
      trustServerCertificate: true,
    },
  } as any,
});
