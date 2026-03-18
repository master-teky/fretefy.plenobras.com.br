import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";
import { db } from "@/server/db";
import { mdfeMotoristas } from "@/server/db/schema/motorista";
import { syncMotoristas } from "@/server/services/sync-motoristas";

export const motoristaRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(mdfeMotoristas);
  }),

  getByDocumento: protectedProcedure
    .input(z.object({ documento: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getMotorista(input.documento);
    }),

  syncAll: protectedProcedure.mutation(async () => {
    return syncMotoristas();
  }),
});