"use client"

import { useCallback, useState } from "react"
import { keepPreviousData } from "@tanstack/react-query"
import { CalendarMinus2, CalendarOff } from "lucide-react"
import { toast } from "sonner"
import type { CargoRow } from "@/types/PbCargoType"
import { trpc } from "@/lib/PbTrpcClient"
import { PbDataTable, type PbColumnDef } from "@/components/shared/PbDataTable"
import { PbCargoDetail } from "@/components/cargo/PbCargoDetail"
import { formatDate } from "@/utils/PbDateUtil"
import { formatAddress, formatCep, formatDocument } from "@/utils/PbStringUtil"

const ALLOWED_PAGE_SIZES = [10, 15, 20]
const DEFAULT_PAGE_SIZE = 20

const columns: PbColumnDef<CargoRow>[] = [
  {
    key: "createdAt",
    header: "Data/Hora",
    render: (row) => <span className="block truncate">{formatDate(row.createdAt)}</span>,
    className: "w-[13%] text-center",
  },
  {
    key: "invoiceNumber",
    header: "NF",
    render: (row) => row.invoiceNumber,
    className: "w-[6%] text-right tabular-nums font-mono",
  },
  {
    key: "series",
    header: "Série",
    render: (row) => row.series || "—",
    className: "w-[4%] text-center font-mono text-muted-foreground",
  },
  {
    key: "conhecimento",
    header: "Conhecimento",
    render: (row) => <span className="block truncate">{row.fretefyCode}</span>,
    className: "w-[9%] font-mono text-muted-foreground",
  },
  {
    key: "driverName",
    header: "Motorista",
    render: (row) => <span className="block truncate">{row.driverName}</span>,
    className: "w-[10%]",
  },
  {
    key: "plate",
    header: "Veículo",
    render: (row) => <span className="font-mono font-semibold">{row.plate}</span>,
    className: "w-[7%] text-center",
  },
  {
    key: "customerName",
    header: "Cliente",
    render: (row) => <span className="block truncate">{row.customerName ?? "—"}</span>,
    className: "w-[12%]",
  },
  {
    key: "customerTaxId",
    header: "Documento",
    render: (row) => <span className="block truncate">{formatDocument(row.customerTaxId)}</span>,
    className: "w-[10%] text-center font-mono text-muted-foreground",
  },
  {
    key: "deliveryZipCode",
    header: "CEP",
    render: (row) => <span className="block truncate">{row.deliveryZipCode ? formatCep(row.deliveryZipCode) : "—"}</span>,
    className: "w-[5%] text-center font-mono text-muted-foreground",
  },
  {
    key: "deliveryAddress",
    header: "Endereço",
    render: (row) => <span className="block truncate">{formatAddress(row.deliveryStreet, row.deliveryNumber, row.deliveryDistrict, row.deliveryCity)}</span>,
    className: "w-[14%]",
  },
  {
    key: "fretefyCode",
    header: "Integrada",
    render: (row) => row.trackingNumber
      ? <CalendarMinus2 className="mx-auto h-4 w-4 text-green-600" />
      : <CalendarOff className="mx-auto h-4 w-4 text-muted-foreground" />,
    className: "w-[7%] text-center",
  },
]

export function PbCargoTable() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedCargo, setSelectedCargo] = useState<CargoRow | null>(null)

  const { data } = trpc.cargo.list.useQuery({ page, pageSize }, { placeholderData: keepPreviousData })

  const searchFn = useCallback((row: CargoRow, query: string) => {
    return (
      String(row.invoiceNumber).includes(query) ||
      row.customerTaxId.includes(query) ||
      (row.customerName ?? "").toLowerCase().includes(query)
    )
  }, [])

  const statusFn = useCallback(() => true, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }, [])

  const handleRowClick = useCallback((row: CargoRow) => {
    if (!row.trackingNumber) {
      toast.warning("Carga não sincronizada", {
        description: `A NF ${row.invoiceNumber}/${row.series} ainda não foi integrada ao Fretefy.`,
      })
      return
    }
    setSelectedCargo(row)
  }, [])

  return <>
    <PbDataTable
      data={data?.data ?? []}
      columns={columns}
      searchPlaceholder="Buscar por nº NF, documento ou cliente..."
      searchFn={searchFn}
      statusFn={statusFn}
      showStatusFilter={false}
      getRowId={(row) => `${row.invoiceNumber}-${row.series}`}
      selectedId={selectedCargo ? `${selectedCargo.invoiceNumber}-${selectedCargo.series}` : null}
      onRowClick={handleRowClick}
      entityName="cargas"
      tableFixed
      serverPagination={{ page, pageSize, total: data?.total ?? 0, onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange }}
    />
    <PbCargoDetail
      cargo={selectedCargo}
      onClose={() => setSelectedCargo(null)}
    />
  </>
}
