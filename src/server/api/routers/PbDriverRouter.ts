import { z } from "zod/v4";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";
import { db } from "@/server/db";
import { mdfeDrivers } from "@/server/db/schema/driver";
import { syncDrivers } from "@/server/services/sync-drivers";

export const PbDriverRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(mdfeDrivers);
  }),

  getByDocument: protectedProcedure
    .input(z.object({ document: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getDriver(input.document);
    }),

  syncAll: protectedProcedure.mutation(async () => {
    return syncDrivers();
  }),
});