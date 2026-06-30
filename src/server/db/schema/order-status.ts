import { mssqlTable, varchar, datetime } from "drizzle-orm/mssql-core"
import { orders } from "./order"

export const orderStatuses = mssqlTable("StatusPedido", {
  orderId: varchar("CodOrcamento_ID").notNull().references(() => orders.id),
  status: varchar("Status").notNull(),
  startDate: datetime("DataInicio"),
  endDate: datetime("DataFim"),
  notes: varchar("Observacao"),
  user: varchar("Usuario"),
})

export type OrderStatus = typeof orderStatuses.$inferSelect
