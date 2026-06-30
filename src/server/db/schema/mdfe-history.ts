import { mssqlTable, varchar, int, datetime } from "drizzle-orm/mssql-core"

export const mdfeHistories = mssqlTable("MDFeHistorico", {
  id: int("ID").primaryKey().identity(),
  manifestId: int("ManifestoID").notNull(),
  userId: varchar("UsuarioID", { length: 10 }).notNull(),
  createdAt: datetime("DataHora").notNull(),
  notes: varchar("Observacao", { length: 1000 }),
  xmlSent: varchar("XmlEnvio", { length: 8000 }),
  xmlReceived: varchar("XmlRetorno", { length: 8000 }),
})

export type MdfeHistory = typeof mdfeHistories.$inferSelect
