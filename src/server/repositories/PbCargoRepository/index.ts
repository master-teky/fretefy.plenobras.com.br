import { getDb } from "@/server/db"
import { mdfe } from "@/server/db/schema/mdfe"
import { mdfeControls } from "@/server/db/schema/mdfe-control"
import { mdfeHistories } from "@/server/db/schema/mdfe-history"
import { mdfeManifestVehicles } from "@/server/db/schema/mdfe-manifest-vehicles"
import { mdfeDrivers } from "@/server/db/schema/driver"
import { mdfeFiscalNotes } from "@/server/db/schema/mdfe-fiscal-notes"
import { mdfeVehicles } from "@/server/db/schema/vehicle"
import { invoices } from "@/server/db/schema/invoice"
import { customers } from "@/server/db/schema/customer"
import { fretefyStatusCarga } from "@/server/db/schema/fretefy-status-carga"
import { eq, and, or, exists, sql, desc } from "drizzle-orm"
import type { CargoRow } from "@/types/PbCargoType"

export interface CargoPage {
  data: CargoRow[]
  total: number
}

export async function findCargos(page: number, pageSize: number): Promise<CargoPage> {
  const db = await getDb()

  const hasEncerramento = exists(
    db
      .select({ one: sql`1` })
      .from(mdfeHistories)
      .where(
        and(
          eq(mdfeHistories.manifestId, mdfe.id),
          eq(mdfeHistories.notes, "ENCERRAMENTO"),
        ),
      ),
  )

  const [countResult, rawRows] = await Promise.all([
    db
      .select({ total: sql<number>`COUNT(DISTINCT CONCAT(CAST(${invoices.invoiceNumber} AS VARCHAR(20)), ${invoices.series}))` })
      .from(mdfe)
      .innerJoin(mdfeControls, eq(mdfe.id, mdfeControls.id))
      .innerJoin(mdfeManifestVehicles, eq(mdfe.id, mdfeManifestVehicles.mdfeId))
      .innerJoin(mdfeDrivers, eq(mdfe.driverId, mdfeDrivers.id))
      .innerJoin(mdfeFiscalNotes, eq(mdfe.id, mdfeFiscalNotes.mdfeId))
      .innerJoin(
        mdfeVehicles,
        and(
          eq(mdfeManifestVehicles.vehicleId, mdfeVehicles.id),
          eq(mdfeDrivers.id, mdfeVehicles.defaultDriverId),
        ),
      )
      .innerJoin(
        invoices,
        and(
          eq(mdfeFiscalNotes.company, invoices.company),
          eq(mdfeFiscalNotes.branch, invoices.branch),
          eq(mdfeFiscalNotes.issuerTaxId, invoices.issuerTaxId),
          sql`${mdfeFiscalNotes.invoiceNumber} = ${invoices.invoiceNumber}`,
          eq(mdfeFiscalNotes.series, invoices.series),
        ),
      )
      .innerJoin(customers, eq(invoices.customerTaxId, customers.taxId))
      .where(hasEncerramento),

    db
      .select({
        createdAt: invoices.invoiceDate,
        invoiceNumber: invoices.invoiceNumber,
        fretefyCode: mdfe.number,
        series: invoices.series,
        driverName: mdfeDrivers.name,
        plate: mdfeVehicles.plate,
        customerName: customers.name,
        customerTaxId: invoices.customerTaxId,
        deliveryZipCode: invoices.deliveryZipCode,
        deliveryStreet: invoices.deliveryStreet,
        deliveryNumber: customers.deliveryNumber,
        deliveryDistrict: invoices.deliveryDistrict,
        deliveryCity: invoices.deliveryCity,
      })
      .from(mdfe)
      .innerJoin(mdfeControls, eq(mdfe.id, mdfeControls.id))
      .innerJoin(mdfeManifestVehicles, eq(mdfe.id, mdfeManifestVehicles.mdfeId))
      .innerJoin(mdfeDrivers, eq(mdfe.driverId, mdfeDrivers.id))
      .innerJoin(mdfeFiscalNotes, eq(mdfe.id, mdfeFiscalNotes.mdfeId))
      .innerJoin(
        mdfeVehicles,
        and(
          eq(mdfeManifestVehicles.vehicleId, mdfeVehicles.id),
          eq(mdfeDrivers.id, mdfeVehicles.defaultDriverId),
        ),
      )
      .innerJoin(
        invoices,
        and(
          eq(mdfeFiscalNotes.company, invoices.company),
          eq(mdfeFiscalNotes.branch, invoices.branch),
          eq(mdfeFiscalNotes.issuerTaxId, invoices.issuerTaxId),
          sql`${mdfeFiscalNotes.invoiceNumber} = ${invoices.invoiceNumber}`,
          eq(mdfeFiscalNotes.series, invoices.series),
        ),
      )
      .innerJoin(customers, eq(invoices.customerTaxId, customers.taxId))
      .where(hasEncerramento)
      .orderBy(desc(invoices.invoiceDate))
      .offset((page - 1) * pageSize)
      .fetch(pageSize),
  ])

  if (rawRows.length === 0) {
    return { data: [], total: countResult[0]?.total ?? 0 }
  }

  const seen = new Set<string>()
  const uniqueRows = rawRows.filter((row) => {
    const key = `${row.invoiceNumber}-${row.series}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const trackingConditions = uniqueRows.map((row) =>
    and(
      sql`${fretefyStatusCarga.invoiceNumber} = ${row.invoiceNumber}`,
      eq(fretefyStatusCarga.series, row.series),
      eq(fretefyStatusCarga.type, "T"),
    ),
  )

  const trackingRows = await db
    .select({
      invoiceNumber: fretefyStatusCarga.invoiceNumber,
      series: fretefyStatusCarga.series,
      trackingNumber: fretefyStatusCarga.trackingNumber,
    })
    .from(fretefyStatusCarga)
    .where(or(...trackingConditions))

  const trackingMap = new Map(
    trackingRows.map((t) => [`${t.invoiceNumber}-${t.series}`, t.trackingNumber]),
  )

  const data: CargoRow[] = uniqueRows.map((row) => ({
    ...row,
    trackingNumber: trackingMap.get(`${row.invoiceNumber}-${row.series}`) ?? null,
  }))

  return {
    data,
    total: countResult[0]?.total ?? 0,
  }
}