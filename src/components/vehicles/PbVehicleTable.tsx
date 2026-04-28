"use client"

import { useCallback, useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"
import type { MdfeVehicle } from "@/server/db/erp/schema/vehicle"
import { PbDataTable, type PbColumnDef } from "@/components/shared/PbDataTable"
import { PbAvatar } from "@/components/shared/PbAvatar"
import { PbStatusBadge } from "@/components/shared/PbStatusBadge"
import { Button } from "@/components/ui/button"
import { PbVehicleSheet } from "./PbVehicleSheet"
import { syncAllVehiclesAction } from "@/app/(dashboard)/vehicles/actions"
import { cn } from "@/lib/PbShadCnLib"

const WHEEL_TYPE_LABELS: Record<string, string> = {
  "01": "Truck",
  "02": "Toco",
  "03": "Carreta",
  "04": "Van",
  "05": "Furgão",
  "06": "Toco",
}

const BODY_TYPE_LABELS: Record<string, string> = {
  "00": "Baú",
  "01": "Grade Baixa",
  "02": "Baú",
  "03": "Graneleiro",
  "04": "Container",
  "05": "Sider",
}

export function getWheelTypeLabel(code: string | null): string {
  return code ? (WHEEL_TYPE_LABELS[code] ?? code) : "—"
}

export function getBodyTypeLabel(code: string | null): string {
  return code ? (BODY_TYPE_LABELS[code] ?? code) : "—"
}

const columns: PbColumnDef<MdfeVehicle>[] = [
  {
    key: "plate",
    header: "Placa",
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <PbAvatar name={row.plate} active={row.active} />
        <span className="font-semibold">{row.plate}</span>
      </div>
    ),
  },
  {
    key: "brandModel",
    header: "Marca / Modelo",
    render: (row) => `${row.brand} ${row.model}`,
  },
  {
    key: "modelYear",
    header: "Ano",
    render: (row) => row.modelYear,
  },
  {
    key: "wheelType",
    header: "Tipo",
    render: (row) => getWheelTypeLabel(row.wheelType),
  },
  {
    key: "active",
    header: "Status",
    render: (row) => <PbStatusBadge active={row.active} />,
  },
]

interface PbVehicleTableProps {
  data: MdfeVehicle[]
}

export function PbVehicleTable({ data }: PbVehicleTableProps) {
  const [selected, setSelected] = useState<MdfeVehicle | null>(null)
  const [syncing, startSync] = useTransition()

  const searchFn = useCallback((row: MdfeVehicle, query: string) => {
    return (
      row.plate.toLowerCase().includes(query) ||
      row.brand.toLowerCase().includes(query) ||
      row.model.toLowerCase().includes(query) ||
      (row.chassis ?? "").toLowerCase().includes(query)
    )
  }, [])

  const statusFn = useCallback((row: MdfeVehicle) => row.active, [])

  const handleSync = () => {
    startSync(async () => {
      await syncAllVehiclesAction()
    })
  }

  return (
    <>
      <PbDataTable
        data={data}
        columns={columns}
        searchPlaceholder="Buscar por placa, marca ou modelo..."
        searchFn={searchFn}
        statusFn={statusFn}
        onRowClick={setSelected}
        selectedId={selected?.id ?? null}
        getRowId={(row) => row.id}
        entityName="veículos"
        actions={
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-[#ff4700] text-white hover:bg-[#ff4700]/90"
          >
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        }
      />
      <PbVehicleSheet
        vehicle={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
