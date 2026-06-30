import { getDb } from "@/server/db"
import { mdfe } from "@/server/db/schema/mdfe"
import { mdfeControls } from "@/server/db/schema/mdfe-control"
import { mdfeHistories } from "@/server/db/schema/mdfe-history"
import { mdfeManifestVehicles } from "@/server/db/schema/mdfe-manifest-vehicles"
import { mdfeDrivers } from "@/server/db/schema/driver"
import { mdfeFiscalNotes } from "@/server/db/schema/mdfe-fiscal-notes"
import { mdfeStatuses } from "@/server/db/schema/mdfe-status"
import { mdfeVehicles } from "@/server/db/schema/vehicle"
import { invoices } from "@/server/db/schema/invoice"
import { customers } from "@/server/db/schema/customer"
import { fretefyStatusCarga } from "@/server/db/schema/fretefy-status-carga"
import { eq, and, gt, sql, notExists } from "drizzle-orm"
import type { ManifestRow } from "@/types/PbManifestType"

export async function findManifestsSince(date: string): Promise<ManifestRow[]> {
  const db = await getDb()

  const since = new Date(`20${date.replace(/\//g, "-")}`)

  return db
    .select({
      company: mdfe.company,
      branch: mdfe.branch,
      number: mdfe.number,
      driverName: mdfeDrivers.name,
      driverTaxId: mdfeDrivers.taxId,
      plate: mdfeVehicles.plate,
      issuerTaxId: mdfeFiscalNotes.issuerTaxId,
      invoiceNumber: mdfeFiscalNotes.invoiceNumber,
      series: mdfeFiscalNotes.series,
      accessKey: mdfe.accessKey,
      statusDescription: mdfeStatuses.description,
      statusName: mdfeStatuses.name,
      historyNotes: mdfeHistories.notes,
      xmlSent: mdfeHistories.xmlSent,
      xmlReceived: mdfeHistories.xmlReceived,
      customerTaxId: invoices.customerTaxId,
      customerName: customers.name,
      deliveryZipCode: invoices.deliveryZipCode,
      deliveryStreet: invoices.deliveryStreet,
      deliveryNumber: customers.deliveryNumber,
      deliveryDistrict: invoices.deliveryDistrict,
      deliveryCity: invoices.deliveryCity,
      deliveryState: invoices.deliveryState,
    })
    .from(mdfe)
    .innerJoin(mdfeControls, eq(mdfe.id, mdfeControls.id))
    .innerJoin(mdfeHistories, eq(mdfe.id, mdfeHistories.manifestId))
    .innerJoin(mdfeManifestVehicles, eq(mdfe.id, mdfeManifestVehicles.mdfeId))
    .innerJoin(mdfeDrivers, eq(mdfe.driverId, mdfeDrivers.id))
    .innerJoin(mdfeFiscalNotes, eq(mdfe.id, mdfeFiscalNotes.mdfeId))
    .innerJoin(mdfeStatuses, eq(mdfe.statusId, mdfeStatuses.id))
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
    .where(
      and(
        gt(mdfe.createdAt, since),
        eq(mdfeHistories.notes, "ENCERRAMENTO"),
        notExists(
          db.select({ one: sql`1` })
            .from(fretefyStatusCarga)
            .where(
              and(
                eq(fretefyStatusCarga.company, mdfeFiscalNotes.company),
                eq(fretefyStatusCarga.branch, mdfeFiscalNotes.branch),
                eq(fretefyStatusCarga.issuerTaxId, mdfeFiscalNotes.issuerTaxId),
                sql`${fretefyStatusCarga.invoiceNumber} = ${mdfeFiscalNotes.invoiceNumber}`,
                eq(fretefyStatusCarga.series, mdfeFiscalNotes.series),
                eq(fretefyStatusCarga.type, "T"),
              ),
            ),
        ),
      ),
    ) as Promise<ManifestRow[]>
}
