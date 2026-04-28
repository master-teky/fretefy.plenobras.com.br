import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { findAllDrivers } from "@/server/repositories/PbDriverRepository"
import { PbDriverTable } from "@/components/drivers/PbDriverTable"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Motoristas" }

export default async function DriversPage() {
  const drivers = await findAllDrivers()

  return (
    <>
      <Header title="Motoristas" />
      <div className="p-6">
        <PbDriverTable data={drivers} />
      </div>
    </>
  )
}
