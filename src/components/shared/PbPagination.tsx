"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/PbShadCnLib"

interface PbPaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  entityName?: string
}

export function PbPagination({ page, pageSize, total, onPageChange, entityName = "registros" }: PbPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  function getVisiblePages(): (number | "ellipsis")[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | "ellipsis")[] = [1]
    if (page > 3) pages.push("ellipsis")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
    return pages
  }

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
      <span>
        Mostrando {start}-{end} de {total} {entityName}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        {getVisiblePages().map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1.5">...</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon-xs"
              className={cn("min-w-6", p === page && "bg-[#003062] hover:bg-[#003062]/90")}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
