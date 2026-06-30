import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { PbVehicleTable } from "@/components/vehicles/PbVehicleTable"

export const metadata: Metadata = { title: "Veículos" }

export default function VehiclesPage() {
  return (
    <>
      <Header title="Veículos" />
      <div className="p-6">
        <PbVehicleTable />
      </div>
    </>
  )
}
