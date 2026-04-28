import { getErpDb } from "@/server/db/erp"
import { mdfeVehicles } from "@/server/db/erp/schema/vehicle"
import { eq } from "drizzle-orm"
import { frtefyHttp } from "@/lib/PbFretefyLib"
import type { FretefyVehicle, FretefyVehicleInput, FretefyType } from "@/types/PbFretefyType"

export async function findActiveVehicles() {
  const db = await getErpDb()
  return db.select().from(mdfeVehicles).where(eq(mdfeVehicles.active, true))
}

export async function findAllVehicles() {
  const db = await getErpDb()
  return db.select().from(mdfeVehicles)
}

export async function getFretefyVehicle(licensePlate: string): Promise<FretefyVehicle> {
  return frtefyHttp.get<FretefyVehicle>(`/veiculo/${licensePlate}`)
}

export async function createFretefyVehicle(data: FretefyVehicleInput): Promise<FretefyVehicle> {
  return frtefyHttp.post<FretefyVehicle>("/veiculo", data)
}

export async function getFretefyVehicleTypes(): Promise<FretefyType[]> {
  return frtefyHttp.get<FretefyType[]>("/tipos/1")
}

export async function getFretefyBodyTypes(): Promise<FretefyType[]> {
  return frtefyHttp.get<FretefyType[]>("/tipos/2")
}
