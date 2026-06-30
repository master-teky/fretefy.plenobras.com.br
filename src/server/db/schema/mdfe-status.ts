import { mssqlTable, varchar, int } from "drizzle-orm/mssql-core"

export const mdfeStatuses = mssqlTable("MDFeStatus", {
  id: int("ID").primaryKey().identity(),
  name: varchar("Nome", { length: 50 }).notNull(),
  description: varchar("Descricao", { length: 200 }),
})

export type MdfeStatus = typeof mdfeStatuses.$inferSelect