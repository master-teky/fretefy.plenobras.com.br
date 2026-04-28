"use client"

import { useCallback, useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"
import type { MdfeDriver } from "@/server/db/erp/schema/driver"
import { PbDataTable, type PbColumnDef } from "@/components/shared/PbDataTable"
import { PbAvatar } from "@/components/shared/PbAvatar"
import { PbStatusBadge } from "@/components/shared/PbStatusBadge"
import { Button } from "@/components/ui/button"
import { PbDriverSheet } from "./PbDriverSheet"
import { syncAllDriversAction } from "@/app/(dashboard)/drivers/actions"
import { cn } from "@/lib/PbShadCnLib"

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR")
}

function isExpired(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = typeof date === "string" ? new Date(date) : date
  return d < new Date()
}

function formatTaxId(taxId: string): string {
  if (taxId.length !== 11) return taxId
  return `${taxId.slice(0, 3)}.${taxId.slice(3, 6)}.${taxId.slice(6, 9)}-${taxId.slice(9)}`
}

const columns: PbColumnDef<MdfeDriver>[] = [
  {
    key: "name",
    header: "Nome",
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <PbAvatar name={row.name} active={row.active} />
        <span className="font-semibold">{row.name}</span>
      </div>
    ),
  },
  {
    key: "taxId",
    header: "CPF",
    render: (row) => formatTaxId(row.taxId),
  },
  {
    key: "registrationNumber",
    header: "CNH",
    render: (row) => row.registrationNumber,
  },
  {
    key: "expirationDate",
    header: "Validade",
    render: (row) => (
      <span className={cn(isExpired(row.expirationDate) && "font-medium text-red-600")}>
        {formatDate(row.expirationDate)}
      </span>
    ),
  },
  {
    key: "active",
    header: "Status",
    render: (row) => <PbStatusBadge active={row.active} />,
  },
]

interface PbDriverTableProps {
  data: MdfeDriver[]
}

export function PbDriverTable({ data }: PbDriverTableProps) {
  const [selected, setSelected] = useState<MdfeDriver | null>(null)
  const [syncing, startSync] = useTransition()

  const searchFn = useCallback((row: MdfeDriver, query: string) => {
    return (
      row.name.toLowerCase().includes(query) ||
      row.taxId.includes(query) ||
      row.registrationNumber.toLowerCase().includes(query)
    )
  }, [])

  const statusFn = useCallback((row: MdfeDriver) => row.active, [])

  const handleSync = () => {
    startSync(async () => {
      await syncAllDriversAction()
    })
  }

  return (
    <>
      <PbDataTable
        data={data}
        columns={columns}
        searchPlaceholder="Buscar por nome, CPF ou CNH..."
        searchFn={searchFn}
        statusFn={statusFn}
        onRowClick={setSelected}
        selectedId={selected?.id ?? null}
        getRowId={(row) => row.id}
        entityName="motoristas"
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
      <PbDriverSheet
        driver={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
