import { mssqlTable, int, varchar, char } from "drizzle-orm/mssql-core"

export const fretefyStatusCarga = mssqlTable("FretefyStatusCarga", {
  id: int("ID").primaryKey().identity(),
  company: varchar("Empresa", { length: 2 }).notNull(),
  branch: varchar("Filial", { length: 2 }).notNull(),
  issuerTaxId: varchar("Cgcemissor", { length: 14 }).notNull(),
  series: varchar("Series", { length: 2 }).notNull(),
  invoiceNumber: int("NumNF").notNull(),
  type: char("Tipo", { length: 1 }).notNull(),
  trackingNumber: varchar("NumeroConhecimento", { length: 50 }).notNull(),
})

export type FretefyStatusCargaInsert = typeof fretefyStatusCarga.$inferInsert