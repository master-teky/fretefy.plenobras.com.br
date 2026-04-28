import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { findAllVehicles } from "@/server/repositories/PbVehicleRepository"
import { PbVehicleTable } from "@/components/vehicles/PbVehicleTable"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Veículos" }

export default async function VehiclesPage() {
  const vehicles = await findAllVehicles()

  return (
    <>
      <Header title="Veículos" />
      <div className="p-6">
        <PbVehicleTable data={vehicles} />
      </div>
    </>
  )
}
