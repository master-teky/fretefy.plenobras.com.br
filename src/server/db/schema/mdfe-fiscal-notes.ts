import { mssqlTable, varchar, int, float } from "drizzle-orm/mssql-core"

export const mdfeFiscalNotes = mssqlTable("MDFeNotasFiscais", {
  id: int("ID").primaryKey().identity(),
  mdfeId: int("MDFeID").notNull(),
  company: varchar("Empresa", { length: 2 }).notNull(),
  branch: varchar("Filial", { length: 2 }).notNull(),
  issuerTaxId: varchar("Cgcemissor", { length: 14 }).notNull(),
  series: varchar("Series", { length: 2 }).notNull(),
  invoiceNumber: float("NumNF").notNull(),
})

export type MdfeFiscalNote = typeof mdfeFiscalNotes.$inferSelect
