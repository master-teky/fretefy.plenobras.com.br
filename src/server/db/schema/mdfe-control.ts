import { mssqlTable, varchar, int, datetime } from "drizzle-orm/mssql-core"

export const mdfeControls = mssqlTable("MDFeControle", {
  id: int("ID").primaryKey().identity(),
  company: varchar("Empresa", { length: 2 }).notNull(),
  branch: varchar("Filial", { length: 2 }).notNull(),
  manifestNumber: int("ManifestoNumero").notNull(),
  userId: varchar("Usuario", { length: 10 }).notNull(),
  createdAt: datetime("DataHora").notNull(),
})

export type MdfeControl = typeof mdfeControls.$inferSelect