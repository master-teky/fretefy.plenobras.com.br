import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";
import { db } from "@/server/db";
import { mdfeVehicles } from "@/server/db/schema/vehicle";
import { syncVehicles } from "@/server/services/sync-vehicles";

export const vehicleRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(mdfeVehicles);
  }),

  getByPlate: protectedProcedure
    .input(z.object({ plate: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getVehicle(input.plate);
    }),

  syncAll: protectedProcedure.mutation(async () => {
    return syncVehicles();
  }),
});