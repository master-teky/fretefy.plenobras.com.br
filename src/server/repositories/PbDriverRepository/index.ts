import { getErpDb } from "@/server/db/erp"
import { mdfeDrivers } from "@/server/db/erp/schema/driver"
import { eq } from "drizzle-orm"
import { frtefyHttp } from "@/lib/PbFretefyLib"
import type { FretefyDriver, FretefyDriverInput } from "@/types/PbFretefyType"

export async function findActiveDrivers() {
  const db = await getErpDb()
  return db.select().from(mdfeDrivers).where(eq(mdfeDrivers.active, true))
}

export async function findAllDrivers() {
  const db = await getErpDb()
  return db.select().from(mdfeDrivers)
}

export async function getFretefyDriver(taxId: string): Promise<FretefyDriver> {
  return frtefyHttp.get<FretefyDriver>(`/motorista/${taxId}`)
}

export async function createFretefyDriver(data: FretefyDriverInput): Promise<FretefyDriver> {
  return frtefyHttp.post<FretefyDriver>("/motorista", data)
}
