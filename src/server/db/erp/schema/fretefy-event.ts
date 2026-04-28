import { mssqlTable, bigint, float, int, smallint, varchar, datetime2, customType } from "drizzle-orm/mssql-core"

const uniqueidentifier = customType<{ data: string; driverData: string }>({
  dataType() {
    return "uniqueidentifier"
  },
})

export const fretefyEvents = mssqlTable("FretefyEvento", {
  id: bigint("id", { mode: "number" }).primaryKey().identity(),
  invoiceId: bigint("notafiscal_id", { mode: "number" }).notNull(),
  invoiceNumber: float("NumNF").notNull(),
  series: varchar("Serie", { length: 2 }).notNull(),
  orderId: int("Pedido"),
  eventType: smallint("tipo_evento").notNull(),
  shipmentId: uniqueidentifier("carga_id").notNull(),
  description: varchar("descricao", { length: 255 }),
  createdAt: datetime2("data_criacao").notNull(),
  identifier: varchar("identificador", { length: 100 }),
  notes: varchar("observacao", { length: 3000 }),
})

export type FretefyEvent = typeof fretefyEvents.$inferSelect
export type FretefyEventInsert = typeof fretefyEvents.$inferInsert
