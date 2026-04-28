import { getAppDb } from "@/server/db/app"
import { shipments } from "@/server/db/app/schema/shipment"
import { shipmentEvents } from "@/server/db/app/schema/shipment-event"
import { eq } from "drizzle-orm"
import type { ShipmentEventType } from "@/types/PbFretefyWebhookType"

interface UpsertShipmentParams {
  id: string
  status: string
  driverName?: string | null
  driverDocument?: string | null
  vehiclePlate?: string | null
  orderReference?: string | null
}

interface InsertShipmentEventParams {
  shipmentId: string
  eventType: ShipmentEventType
  description?: string | null
  occurredAt: Date
  rawPayload?: string | null
}

export async function upsertShipment(params: UpsertShipmentParams) {
  const db = await getAppDb()
  const now = new Date()

  const existing = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(eq(shipments.id, params.id))

  if (existing.length > 0) {
    await db
      .update(shipments)
      .set({
        status: params.status,
        ...(params.driverName !== undefined && { driverName: params.driverName }),
        ...(params.driverDocument !== undefined && { driverDocument: params.driverDocument }),
        ...(params.vehiclePlate !== undefined && { vehiclePlate: params.vehiclePlate }),
        ...(params.orderReference !== undefined && { orderReference: params.orderReference }),
        updatedAt: now,
      })
      .where(eq(shipments.id, params.id))
  } else {
    await db.insert(shipments).values({
      id: params.id,
      status: params.status,
      driverName: params.driverName ?? null,
      driverDocument: params.driverDocument ?? null,
      vehiclePlate: params.vehiclePlate ?? null,
      orderReference: params.orderReference ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }
}

export async function insertShipmentEvent(params: InsertShipmentEventParams) {
  const db = await getAppDb()

  await db.insert(shipmentEvents).values({
    shipmentId: params.shipmentId,
    eventType: params.eventType,
    description: params.description ?? null,
    occurredAt: params.occurredAt,
    receivedAt: new Date(),
    rawPayload: params.rawPayload ?? null,
  })
}
