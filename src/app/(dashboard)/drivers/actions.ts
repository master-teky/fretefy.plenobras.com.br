"use server"

import { auth } from "@/server/auth"
import { syncDrivers } from "@/server/services/PbDriverSyncService"
import { revalidatePath } from "next/cache"

export async function syncAllDriversAction() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autorizado")

  const result = await syncDrivers()
  revalidatePath("/drivers")
  return result
}
