import { mssqlTable, varchar, datetime } from "drizzle-orm/mssql-core"

export const shipments = mssqlTable("Shipments", {
  id: varchar("Id", { length: 100 }).primaryKey(),
  status: varchar("Status", { length: 20 }).notNull(),
  driverName: varchar("DriverName", { length: 300 }),
  driverDocument: varchar("DriverDocument", { length: 14 }),
  vehiclePlate: varchar("VehiclePlate", { length: 10 }),
  orderReference: varchar("OrderReference", { length: 100 }),
  createdAt: datetime("CreatedAt").notNull(),
  updatedAt: datetime("UpdatedAt").notNull(),
})

export type Shipment = typeof shipments.$inferSelect
