import { createTRPCRouter } from "./trpc";
import { trackingRouter } from "./routers/tracking";
import { driverRouter } from "./routers/driver";
import { vehicleRouter } from "./routers/vehicle";

export const appRouter = createTRPCRouter({
  tracking: trackingRouter,
  driver: driverRouter,
  vehicle: vehicleRouter,
});

export type AppRouter = typeof appRouter;