import { getDb } from "@/server/db"
import { mdfeVehicles } from "@/server/db/schema/vehicle"
import { eq } from "drizzle-orm"
import { fretefyHttp } from "@/lib/PbFretefyLib"
import type { FretefyVehicle, FretefyVehicleInput, FretefyType } from "@/types/PbFretefyType"

export async function findActiveVehicles() {
  const db = await getDb()
  return db.select().from(mdfeVehicles).where(eq(mdfeVehicles.active, true))
}

export async function findAllVehicles() {
  const db = await getDb()
  return db.select().from(mdfeVehicles)
}

export async function getFretefyVehicle(licensePlate: string): Promise<FretefyVehicle> {
  return fretefyHttp.get<FretefyVehicle>(`/veiculo/${licensePlate}`)
}

export async function createFretefyVehicle(data: FretefyVehicleInput): Promise<FretefyVehicle> {
  return fretefyHttp.post<FretefyVehicle>("/veiculo", {
    body: JSON.stringify(data)
  })
}

export async function getFretefyVehicleTypes(): Promise<FretefyType[]> {
  return fretefyHttp.get<FretefyType[]>("/tipos/1")
}

export async function getFretefyBodyTypes(): Promise<FretefyType[]> {
  return fretefyHttp.get<FretefyType[]>("/tipos/2")
}