import { createTRPCRouter } from "./trpc";
import { trackingRouter } from "./routers/tracking";
import { motoristaRouter } from "./routers/motorista";
import { veiculoRouter } from "./routers/veiculo";

export const appRouter = createTRPCRouter({
  tracking: trackingRouter,
  motorista: motoristaRouter,
  veiculo: veiculoRouter,
});

export type AppRouter = typeof appRouter;