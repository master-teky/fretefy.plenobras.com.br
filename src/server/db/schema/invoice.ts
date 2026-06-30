import { mssqlTable, varchar, int, datetime, float } from "drizzle-orm/mssql-core"

export const invoices = mssqlTable("NFiscal", {
  company: varchar("Empresa", { length: 2 }).notNull(),
  branch: varchar("Filial", { length: 2 }).notNull(),
  issuerTaxId: varchar("Cgcemissor", { length: 14 }).notNull(),
  series: varchar("Series", { length: 2 }).notNull(),
  invoiceNumber: float("NumNF").notNull(),
  orderId: int("CodOrcamento_ID").notNull(),
  customerTaxId: varchar("CGC", { length: 14 }).notNull(),
  salesRepId: varchar("CodVendedor_ID", { length: 10 }).notNull(),
  attendantId: varchar("Atendente_ID", { length: 10 }).notNull(),
  invoiceDate: datetime("DataNota").notNull(),
  deliveryDate: datetime("DataEntrega").notNull(),
  paymentTermId: varchar("CondPagto_ID", { length: 3 }).notNull(),
  status: varchar("Status", { length: 2 }).notNull(),
  carrierId: int("CodTransportadora_ID"),
  contactName: varchar("ConttNome", { length: 30 }),
  contactPhone: varchar("ConttFone", { length: 15 }),
  invoiceType: varchar("TipoNota"),
  danfe: varchar("DANFE", { length: 50 }),
  totalAmount: float("VlNota"),
  deliveryStreet: varchar("ENDENT", { length: 100 }),
  deliveryDistrict: varchar("BAIENT", { length: 65 }),
  deliveryCity: varchar("CIDENT", { length: 40 }),
  deliveryState: varchar("ESTENT", { length: 2 }),
  deliveryZipCode: varchar("CEPENT", { length: 8 }),
})

export type Invoice = typeof invoices.$inferSelect
