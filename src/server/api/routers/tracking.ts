import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";

export const trackingRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        situacao: z.number().optional(),
        dhInicio: z.string().optional(),
        dhFim: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return fretefy.listCargas({
        situacao: input?.situacao,
        dhReferenciaInicio: input?.dhInicio,
        dhReferenciaFim: input?.dhFim,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getCarga(input.id);
    }),
});