import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { PbCargoTable } from "@/components/cargo/PbCargoTable"

export const metadata: Metadata = { title: "Cargas" }

export default function CargoPage() {
  return <>
    <Header title="Cargas" />
    <div className="p-6">
      <PbCargoTable />
    </div>
  </>
}
