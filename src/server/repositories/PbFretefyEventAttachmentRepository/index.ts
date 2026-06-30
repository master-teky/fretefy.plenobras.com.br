import { getDb } from "@/server/db"
import {
  fretefyEventAttachments,
  type FretefyEventAttachment,
  type FretefyEventAttachmentInsert,
} from "@/server/db/schema/fretefy-event-attachment"
import { fretefyEvents } from "@/server/db/schema/fretefy-event"
import { eq, and, sql } from "drizzle-orm"
import type { EventAttachmentRow } from "@/types/PbFretefyEventType"

export type InsertFretefyEventAttachmentParams = Omit<FretefyEventAttachmentInsert, "id">

export async function insertFretefyEventAttachment(
  params: InsertFretefyEventAttachmentParams,
): Promise<void> {
  const db = await getDb()
  await db.insert(fretefyEventAttachments).values(params)
}

export async function findAttachmentsByEventId(eventId: number): Promise<FretefyEventAttachment[]> {
  const db = await getDb()
  return db
    .select()
    .from(fretefyEventAttachments)
    .where(eq(fretefyEventAttachments.eventId, eventId))
}

export async function findEventsByInvoice(
  invoiceNumber: number,
  series: string,
): Promise<EventAttachmentRow[]> {
  const db = await getDb()

  return db
    .select({
      eventId: fretefyEvents.id,
      eventType: fretefyEvents.eventType,
      description: fretefyEvents.description,
      notes: fretefyEvents.notes,
      createdAt: fretefyEvents.createdAt,
      attachmentId: fretefyEventAttachments.id,
      url: fretefyEventAttachments.url,
      contentType: fretefyEventAttachments.contentType,
      fileName: fretefyEventAttachments.fileName,
      size: fretefyEventAttachments.size,
    })
    .from(fretefyEvents)
    .leftJoin(fretefyEventAttachments, eq(fretefyEvents.id, fretefyEventAttachments.eventId))
    .where(
      and(
        sql`${fretefyEvents.invoiceNumber} = ${invoiceNumber}`,
        eq(fretefyEvents.series, series),
      ),
    )
    .orderBy(fretefyEvents.createdAt) as Promise<EventAttachmentRow[]>
}