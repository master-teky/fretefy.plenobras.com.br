import { z } from "zod/v4"
import { createTRPCRouter, protectedProcedure } from "../../trpc"
import { listShipments, getShipment } from "@/server/repositories/PbShipmentRepository"

export const PbTrackingRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return listShipments({
        situacao: input?.status,
        dhReferenciaInicio: input?.startDate,
        dhReferenciaFim: input?.endDate,
      })
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return getShipment(input.id)
    }),
})
