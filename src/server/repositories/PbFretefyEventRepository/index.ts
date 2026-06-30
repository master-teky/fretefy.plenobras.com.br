import { and, eq, isNull, sql, type SQL } from "drizzle-orm"
import { getDb } from "@/server/db"
import { fretefyEvents, type FretefyEvent, type FretefyEventInsert } from "@/server/db/schema/fretefy-event"
import { createLogger } from "@/lib/PbLoggerLib"

export type InsertFretefyEventParams = Omit<FretefyEventInsert, "id">
export type FretefyEventFilter = Partial<Omit<FretefyEvent, "id">>

const log = createLogger("repository-fretefy-event")

function col<T>(column: Parameters<typeof eq>[0], val: T | null | undefined): SQL | undefined {
  if (val === undefined) return undefined
  return val === null ? isNull(column) : eq(column, val as Parameters<typeof eq>[1])
}

export async function existsFretefyEvent(filter: FretefyEventFilter): Promise<boolean> {
  const conditions = [
    col(fretefyEvents.invoiceId, filter.invoiceId),
    col(fretefyEvents.invoiceNumber, filter.invoiceNumber),
    col(fretefyEvents.series, filter.series),
    col(fretefyEvents.orderId, filter.orderId),
    col(fretefyEvents.eventType, filter.eventType),
    col(fretefyEvents.shipmentId, filter.shipmentId),
    col(fretefyEvents.description, filter.description),
    col(fretefyEvents.createdAt, filter.createdAt),
    col(fretefyEvents.identifier, filter.identifier),
    col(fretefyEvents.notes, filter.notes),
  ].filter((c): c is SQL => c !== undefined)

  if (conditions.length === 0) return false

  const db = await getDb()
  const rows = await db
    .select({ id: fretefyEvents.id })
    .from(fretefyEvents)
    .where(and(...conditions))

  return rows.length > 0
}

export async function existsFretefyEventByInvoice(
  invoiceNumber: number,
  series: string,
): Promise<boolean> {
  const db = await getDb()
  const rows = await db
    .select({ id: fretefyEvents.id })
    .from(fretefyEvents)
    .where(and(eq(fretefyEvents.invoiceNumber, invoiceNumber), eq(fretefyEvents.series, series)))
  return rows.length > 0
}

export async function insertFretefyEvent(params: InsertFretefyEventParams): Promise<number> {
  const db = await getDb()
  const result = await db
    .insert(fretefyEvents)
    .output({ id: fretefyEvents.id })
    .values(params)

  const inserted = result[0]
  if (!inserted) {
    throw new Error("Inserção em FretefyEvento não retornou id")
  }

  log.info({ "@NumNF": params.invoiceNumber, "@Serie": params.series }, "Chamando dbo.PR_FretefyEvento_UpdateStatus")
  await db.execute(
    sql`EXEC dbo.PR_FretefyEvento_UpdateStatus @NumNF = ${params.invoiceNumber}, @Serie = ${params.series}`,
  )

  return inserted.id
}
