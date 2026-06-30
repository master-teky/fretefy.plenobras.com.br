import { getDb } from "@/server/db"
import { mdfeDrivers } from "@/server/db/schema/driver"
import { eq } from "drizzle-orm"
import { fretefyHttp } from "@/lib/PbFretefyLib"
import type { FretefyDriver, FretefyDriverInput } from "@/types/PbFretefyType"

export async function findActiveDrivers() {
  const db = await getDb()
  return db.select().from(mdfeDrivers).where(eq(mdfeDrivers.active, true))
}

export async function findAllDrivers() {
  const db = await getDb()
  return db.select().from(mdfeDrivers)
}

export async function getFretefyDriver(taxId: string): Promise<FretefyDriver> {
  return fretefyHttp.get<FretefyDriver>(`/motorista/${taxId}`)
}

export async function createFretefyDriver(data: FretefyDriverInput): Promise<FretefyDriver> {
  return fretefyHttp.post<FretefyDriver>("/motorista", {body: JSON.stringify(data)})
}
