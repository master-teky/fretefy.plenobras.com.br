import { getDb } from "@/server/db"
import { orders } from "@/server/db/schema/order"
import { orderItems } from "@/server/db/schema/order-item"
import { orderStatuses } from "@/server/db/schema/order-status"
import { customers } from "@/server/db/schema/customer"
import { municipalities } from "@/server/db/schema/municipality"
import { eq, and, isNull, notInArray, inArray, sql } from "drizzle-orm"

export interface DeliveryOrderRow {
  orderId: number
  deliveryDate: Date
  customerName: string | null
  customerTaxId: string
  customerEmail: string | null
  deliveryStreet: string | null
  deliveryNumber: string | null
  deliveryDistrict: string | null
  deliveryCity: string | null
  deliveryZipCode: string | null
  route: string | null
}

export interface DeliveryOrderItemRow {
  orderId: number
  itemNumber: number
  productId: number
  unitOfMeasure: string
  quantity: number | null
  unitPrice: number
  totalPrice: number
  weight: number | null
  notes: string | null
}

export interface DeliveryOrder extends DeliveryOrderRow {
  items: DeliveryOrderItemRow[]
}

export async function findPendingDeliveryOrders(): Promise<DeliveryOrder[]> {
  const db = await getDb()

  // Orders with status 40 (ready to deliver), not finished, not priority 31/32
  // orderStatuses.orderId is varchar, orders.id is int — use sql cast for the join
  const orderRows = await db
    .select({
      orderId: orders.id,
      deliveryDate: orders.deliveryDate,
      customerName: customers.name,
      customerTaxId: orders.customerTaxId,
      customerEmail: customers.email,
      deliveryStreet: orders.deliveryStreet,
      deliveryNumber: orders.deliveryNumber,
      deliveryDistrict: orders.deliveryDistrict,
      deliveryCity: orders.deliveryCity,
      deliveryZipCode: orders.deliveryZipCode,
      route: municipalities.adminRegion,
    })
    .from(orderStatuses)
    .innerJoin(orders, eq(sql`CAST(${orders.id} AS VARCHAR)`, orderStatuses.orderId))
    .innerJoin(customers, eq(customers.taxId, orders.customerTaxId))
    .innerJoin(
      municipalities,
      and(
        eq(municipalities.name, orders.deliveryCity),
        eq(municipalities.state, orders.deliveryState),
      ),
    )
    .where(
      and(
        eq(orderStatuses.status, "40"),
        isNull(orderStatuses.endDate),
        notInArray(orders.priority, ["31", "32"]),
      ),
    )

  if (orderRows.length === 0) return []

  // Fetch items for all matched orders in a single query
  const orderIds = orderRows.map((o) => o.orderId)
  const itemRows = await db
    .select({
      orderId: orderItems.orderId,
      itemNumber: orderItems.itemNumber,
      productId: orderItems.productId,
      unitOfMeasure: orderItems.unitOfMeasure,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      weight: orderItems.weight,
      notes: orderItems.notes,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))

  const itemsByOrder = new Map<number, DeliveryOrderItemRow[]>()
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? []
    list.push(item)
    itemsByOrder.set(item.orderId, list)
  }

  return orderRows.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.orderId) ?? [],
  }))
}
