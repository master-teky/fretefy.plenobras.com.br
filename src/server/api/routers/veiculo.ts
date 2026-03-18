import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";
import { db } from "@/server/db";
import { mdfeVeiculos } from "@/server/db/schema/veiculo";
import { syncVeiculos } from "@/server/services/sync-veiculos";

export const veiculoRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(mdfeVeiculos);
  }),

  getByPlaca: protectedProcedure
    .input(z.object({ placa: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getVeiculo(input.placa);
    }),

  syncAll: protectedProcedure.mutation(async () => {
    return syncVeiculos();
  }),
});