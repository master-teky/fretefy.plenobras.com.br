import { createTRPCRouter } from "./trpc";
import { PbTrackingRouter } from "./routers/PbTrackingRouter";
import { PbDriverRouter } from "./routers/PbDriverRouter";
import { PbVehicleRouter } from "./routers/PbVehicleRouter";

export const appRouter = createTRPCRouter({
  tracking: PbTrackingRouter,
  driver: PbDriverRouter,
  vehicle: PbVehicleRouter,
});

export type AppRouter = typeof appRouter;