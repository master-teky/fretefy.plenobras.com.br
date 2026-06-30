import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { PbDriverTable } from "@/components/drivers/PbDriverTable"

export const metadata: Metadata = { title: "Motoristas" }

export default function DriversPage() {
  return (
    <>
      <Header title="Motoristas" />
      <div className="p-6">
        <PbDriverTable />
      </div>
    </>
  )
}
