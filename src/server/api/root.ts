import { createTRPCRouter } from "./trpc";
import { PbTrackingRouter } from "./routers/PbTrackingRouter";
import { PbDriverRouter } from "./routers/PbDriverRouter";
import { PbVehicleRouter } from "./routers/PbVehicleRouter";
import { PbDeliveryOrderRouter } from "./routers/PbDeliveryOrderRouter";

export const appRouter = createTRPCRouter({
  tracking: PbTrackingRouter,
  driver: PbDriverRouter,
  vehicle: PbVehicleRouter,
  deliveryOrder: PbDeliveryOrderRouter,
});

export type AppRouter = typeof appRouter;