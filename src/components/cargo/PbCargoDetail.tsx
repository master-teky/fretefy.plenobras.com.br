"use client"

import { Paperclip } from "lucide-react"
import type { CargoRow } from "@/types/PbCargoType"
import { FretefyCargoSituacaoLabel } from "@/types/PbFretefyType"
import { trpc } from "@/lib/PbTrpcClient"
import { PbDetailSheet, PbDetailSection, PbDetailField } from "@/components/shared/PbDetailSheet"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/utils/PbDateUtil"

interface PbCargoDetailProps {
  cargo: CargoRow | null
  onClose: () => void
}

export function PbCargoDetail({ cargo, onClose }: PbCargoDetailProps) {
  const { data, isPending } = trpc.cargo.getDetail.useQuery(
    {
      trackingNumber: cargo?.trackingNumber ?? "",
      invoiceNumber: cargo?.invoiceNumber ?? 0,
      series: cargo?.series ?? "",
    },
    { enabled: !!cargo?.trackingNumber },
  )

  const loading = !!cargo?.trackingNumber && isPending

  return (
    <PbDetailSheet
      open={cargo !== null}
      onOpenChange={(open) => { if (!open) onClose() }}
      title={cargo ? `NF ${cargo.invoiceNumber}/${cargo.series}` : ""}
    >
      {loading && (
        <div className="space-y-5">
          <div className="rounded-xl bg-linear-to-br from-[#f0f7ff] to-[#e8f4fd] border border-[#d0e3f7] p-4">
            <Skeleton className="mb-3 h-3 w-16" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="mb-3 h-3 w-24" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="mb-3 h-3 w-28" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="mt-1.5 h-2.5 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && data && cargo && (
        <div className="space-y-5">
          <PbDetailSection title="Carga" highlighted>
            <div className="grid grid-cols-2 gap-3">
              <PbDetailField label="NF" value={`${cargo.invoiceNumber}/${cargo.series}`} />
              <PbDetailField label="Conhecimento" value={cargo.fretefyCode} />
              <PbDetailField label="Motorista" value={cargo.driverName} />
              <PbDetailField label="Veículo" value={cargo.plate} />
              <PbDetailField label="Cliente" value={cargo.customerName ?? "—"} />
              <PbDetailField label="Documento" value={cargo.customerTaxId} />
            </div>
          </PbDetailSection>

          <PbDetailSection title="Status Fretefy">
            <div className="grid grid-cols-2 gap-3">
              <PbDetailField
                label="Situação"
                value={FretefyCargoSituacaoLabel[data.shipment.situacaoOfertaCarga] ?? `Código ${data.shipment.situacaoOfertaCarga}`}
              />
              <PbDetailField label="ID Fretefy" value={data.shipment.id} />
            </div>
          </PbDetailSection>

          <PbDetailSection title="Arquivos relacionados">
            {data.events.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Não há arquivos relacionados a esta carga</p>
            ) : (
              <div className="space-y-2">
                {data.events.map((ev, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{ev.description ?? `Evento ${ev.eventType}`}</span>
                      <span className="shrink-0 text-muted-foreground">{formatDate(ev.createdAt)}</span>
                    </div>
                    {ev.attachmentId && (
                      <a
                        href={`/api/download-file?eventId=${ev.eventId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 flex items-center gap-1 text-brand-navy hover:underline"
                      >
                        <Paperclip className="h-3 w-3" />
                        {ev.fileName ?? "Anexo"}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </PbDetailSection>
        </div>
      )}
    </PbDetailSheet>
  )
}
