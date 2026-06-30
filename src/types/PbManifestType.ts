import { z } from "zod/v4"

export const manifestRowSchema = z.object({
  company: z.string(),
  branch: z.string(),
  number: z.number(),
  driverName: z.string(),
  driverTaxId: z.string(),
  plate: z.string(),
  issuerTaxId: z.string(),
  invoiceNumber: z.number(),
  series: z.string(),
  accessKey: z.string().nullable(),
  statusName: z.string(),
  statusDescription: z.string().nullable(),
  historyNotes: z.string().nullable(),
  xmlSent: z.string().nullable(),
  xmlReceived: z.string().nullable(),
  customerTaxId: z.string(),
  customerName: z.string().nullable(),
  deliveryStreet: z.string().nullable(),
  deliveryNumber: z.string().nullable(),
  deliveryDistrict: z.string().nullable(),
  deliveryCity: z.string().nullable(),
  deliveryState: z.string().nullable(),
  deliveryZipCode: z.string().nullable(),
})

export type ManifestRow = z.infer<typeof manifestRowSchema>