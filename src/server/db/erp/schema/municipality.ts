import { mssqlTable, varchar } from "drizzle-orm/mssql-core"

export const municipalities = mssqlTable("Municipios", {
  state: varchar("UF").notNull(),
  name: varchar("Municipio").notNull(),
  ibgeCode: varchar("CodIBGE"),
  adminRegion: varchar("RegiaoAdm"),
})

export type Municipality = typeof municipalities.$inferSelect
