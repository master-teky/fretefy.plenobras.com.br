"use client"

import { type ReactNode, useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { PbSearchInput } from "./PbSearchInput"
import { PbStatusFilter, type StatusFilterValue } from "./PbStatusFilter"
import { PbPagination } from "./PbPagination"
import { cn } from "@/lib/PbShadCnLib"

export interface PbColumnDef<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export interface ServerPagination {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

interface PbDataTableProps<T> {
  data: T[]
  columns: PbColumnDef<T>[]
  searchPlaceholder?: string
  searchFn: (row: T, query: string) => boolean
  statusFn: (row: T) => boolean
  onRowClick?: (row: T) => void
  selectedId?: number | string | null
  getRowId: (row: T) => number | string
  actions?: ReactNode
  entityName?: string
  pageSize?: number
  loading?: boolean
  showStatusFilter?: boolean
  tableFixed?: boolean
  serverPagination?: ServerPagination
}

export function PbDataTable<T>({
  data,
  columns,
  searchPlaceholder = "Buscar...",
  searchFn,
  statusFn,
  onRowClick,
  selectedId,
  getRowId,
  actions,
  entityName = "registros",
  pageSize = 10,
  loading,
  showStatusFilter = true,
  tableFixed = false,
  serverPagination,
}: PbDataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilterValue>("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = data
    if (status !== "all") {
      result = result.filter((row) => (status === "active" ? statusFn(row) : !statusFn(row)))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((row) => searchFn(row, q))
    }
    return result
  }, [data, search, status, searchFn, statusFn])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = serverPagination
    ? filtered
    : filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-8 w-[180px]" />
          </div>
          <Skeleton className="h-8 w-[130px]" />
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b p-4">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PbSearchInput
            placeholder={searchPlaceholder}
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
          />
          {showStatusFilter && <PbStatusFilter
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
          />}
        </div>
        {actions}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <Table className={cn(tableFixed && "table-fixed w-full")}>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "px-5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground",
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => {
                const id = getRowId(row)
                const isSelected = selectedId === id
                return (
                  <TableRow
                    key={id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected && "border-l-[3px] border-l-[#003062] bg-[#f0f7ff]",
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn("px-5", col.className)}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {serverPagination ? (
          <PbPagination
            page={serverPagination.page}
            pageSize={serverPagination.pageSize}
            total={serverPagination.total}
            onPageChange={serverPagination.onPageChange}
            onPageSizeChange={serverPagination.onPageSizeChange}
            entityName={entityName}
          />
        ) : (
          <PbPagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            entityName={entityName}
          />
        )}
      </div>
    </div>
  )
}
