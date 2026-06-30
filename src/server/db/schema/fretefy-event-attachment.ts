import { mssqlTable, bigint, varchar, datetime2 } from "drizzle-orm/mssql-core"
import { fretefyEvents } from "./fretefy-event"

export const fretefyEventAttachments = mssqlTable("FretefyEventoAnexo", {
  id: bigint("id", { mode: "number" }).primaryKey().identity(),
  eventId: bigint("evento_id", { mode: "number" })
    .notNull()
    .references(() => fretefyEvents.id),
  url: varchar("url", { length: 1000 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  size: bigint("tamanho", { mode: "number" }).notNull(),
  fileName: varchar("nome_arquivo", { length: 255 }),
  createdAt: datetime2("data_criacao").notNull(),
})

export type FretefyEventAttachment = typeof fretefyEventAttachments.$inferSelect
export type FretefyEventAttachmentInsert = typeof fretefyEventAttachments.$inferInsert
