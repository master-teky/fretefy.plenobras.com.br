import { mssqlTable, int } from "drizzle-orm/mssql-core"

export const mdfeManifestVehicles = mssqlTable("MDFeManifestoVeiculos", {
  id: int("ID").primaryKey().identity(),
  mdfeId: int("MDFeID").notNull(),
  vehicleId: int("MDFeVeiculoID").notNull(),
})

export type MdfeManifestVehicle = typeof mdfeManifestVehicles.$inferSelect
