import { z } from "zod/v4"
import { createTRPCRouter, protectedProcedure } from "../../trpc"
import { findAllDrivers, getFretefyDriver } from "@/server/repositories/PbDriverRepository"
import { syncDrivers } from "@/server/services/PbDriverSyncService"

export const PbDriverRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return findAllDrivers()
  }),

  getByDocument: protectedProcedure
    .input(z.object({ document: z.string() }))
    .query(async ({ input }) => {
      return getFretefyDriver(input.document)
    }),

  syncAll: protectedProcedure.mutation(async () => {
    return syncDrivers()
  }),
})
