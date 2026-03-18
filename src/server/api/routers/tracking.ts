import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";

export const trackingRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return fretefy.listShipments({
        situacao: input?.status,
        dhReferenciaInicio: input?.startDate,
        dhReferenciaFim: input?.endDate,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getShipment(input.id);
    }),
});