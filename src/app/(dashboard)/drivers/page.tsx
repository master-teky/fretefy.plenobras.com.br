import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Truck } from "lucide-react";

export const metadata: Metadata = { title: "Motoristas" }

export default function DriversPage() {
  return <>
    <Header title="Motoristas" />
    <div className="p-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-[3px] bg-gradient-to-r from-[#ff4700] to-[#ff6b35]" />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 rounded-full bg-[#003062]/5 p-4">
            <Truck className="h-8 w-8 text-[#003062]/40" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Motoristas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Gestão de motoristas será implementada na fase 2.
          </p>
        </div>
      </div>
    </div>
  </>
}