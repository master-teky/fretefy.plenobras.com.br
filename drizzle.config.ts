import { defineConfig } from "drizzle-kit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineConfig({
  dialect: "mssql" as any,
  schema: "./src/server/db/schema",
  // MSSQL credentials — types not yet in stable drizzle-kit, cast to bypass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbCredentials: {
    server: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT || "1433"),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    options: {
      trustServerCertificate: true,
    },
  } as any,
});
