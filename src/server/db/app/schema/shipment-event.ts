import { mssqlTable, varchar, int, datetime } from "drizzle-orm/mssql-core"
import { shipments } from "./shipment"

export const shipmentEvents = mssqlTable("ShipmentEvents", {
  id: int("Id").primaryKey().identity(),
  shipmentId: varchar("ShipmentId", { length: 100 }).notNull().references(() => shipments.id),
  eventType: varchar("EventType", { length: 50 }).notNull(),
  description: varchar("Description", { length: 500 }),
  occurredAt: datetime("OccurredAt").notNull(),
  receivedAt: datetime("ReceivedAt").notNull(),
  rawPayload: varchar("RawPayload", { length: 8000 }),
})

export type ShipmentEvent = typeof shipmentEvents.$inferSelect
