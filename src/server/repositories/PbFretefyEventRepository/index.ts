import { getErpDb } from "@/server/db/erp"
import { fretefyEvents, type FretefyEventInsert } from "@/server/db/erp/schema/fretefy-event"

export type InsertFretefyEventParams = Omit<FretefyEventInsert, "id">

export async function insertFretefyEvent(params: InsertFretefyEventParams): Promise<void> {
  const db = await getErpDb()
  await db.insert(fretefyEvents).values(params)
}
