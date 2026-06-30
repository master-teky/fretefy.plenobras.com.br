import { z } from "zod/v4"

export const cargoRowSchema = z.object({
  createdAt: z.date(),
  invoiceNumber: z.number(),
  fretefyCode: z.number(),
  trackingNumber: z.string().nullable(),
  driverName: z.string(),
  plate: z.string(),
  series: z.string(),
  customerName: z.string().nullable(),
  customerTaxId: z.string(),
  deliveryZipCode: z.string().nullable(),
  deliveryStreet: z.string().nullable(),
  deliveryNumber: z.string().nullable(),
  deliveryDistrict: z.string().nullable(),
  deliveryCity: z.string().nullable(),
})

export type CargoRow = z.infer<typeof cargoRowSchema>