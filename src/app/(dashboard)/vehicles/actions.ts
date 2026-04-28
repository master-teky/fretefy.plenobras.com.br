"use server"

import { auth } from "@/server/auth"
import { syncVehicles } from "@/server/services/PbVehicleSyncService"
import { revalidatePath } from "next/cache"

export async function syncAllVehiclesAction() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autorizado")

  const result = await syncVehicles()
  revalidatePath("/vehicles")
  return result
}
