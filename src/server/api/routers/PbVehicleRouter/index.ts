import { z } from "zod/v4"
import { createTRPCRouter, protectedProcedure } from "../../trpc"
import { findAllVehicles, getFretefyVehicle } from "@/server/repositories/PbVehicleRepository"
import { syncVehicles } from "@/server/services/PbVehicleSyncService"

export const PbVehicleRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return findAllVehicles()
  }),

  getByPlate: protectedProcedure
    .input(z.object({ plate: z.string() }))
    .query(async ({ input }) => {
      return getFretefyVehicle(input.plate)
    }),

  syncAll: protectedProcedure.mutation(async () => {
    return syncVehicles()
  }),
})
