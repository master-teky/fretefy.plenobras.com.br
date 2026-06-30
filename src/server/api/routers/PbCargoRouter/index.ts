import { z } from "zod/v4"
import { createTRPCRouter, protectedProcedure } from "../../trpc"
import { findCargos } from "@/server/repositories/PbCargoRepository"
import { getCargo } from "@/server/repositories/PbCargoOfferRepository"
import { findEventsByInvoice } from "@/server/repositories/PbFretefyEventAttachmentRepository"

export const PbCargoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      return findCargos(input.page, input.pageSize)
    }),

  getDetail: protectedProcedure
    .input(z.object({
      trackingNumber: z.string(),
      invoiceNumber: z.number(),
      series: z.string(),
    }))
    .query(async ({ input }) => {
      const [shipment, events] = await Promise.all([
        getCargo(input.trackingNumber),
        findEventsByInvoice(input.invoiceNumber, input.series),
      ])
      return { shipment, events }
    }),
})