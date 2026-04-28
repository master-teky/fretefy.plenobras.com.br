import { createTRPCRouter, protectedProcedure } from "../../trpc"
import { findPendingDeliveryOrders } from "@/server/repositories/PbDeliveryOrderRepository"

export const PbDeliveryOrderRouter = createTRPCRouter({
  listPending: protectedProcedure.query(async () => {
    return findPendingDeliveryOrders()
  }),
})
