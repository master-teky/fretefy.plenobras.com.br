"use client"

import type { MdfeVehicle } from "@/server/db/erp/schema/vehicle"
import { PbDetailSheet, PbDetailSection, PbDetailField } from "@/components/shared/PbDetailSheet"
import { PbAvatar } from "@/components/shared/PbAvatar"
import { PbStatusBadge } from "@/components/shared/PbStatusBadge"
import { getWheelTypeLabel, getBodyTypeLabel } from "./PbVehicleTable"

function formatWeight(kg: number): string {
  if (!kg) return "—"
  return `${kg.toLocaleString("pt-BR")} kg`
}

interface PbVehicleSheetProps {
  vehicle: MdfeVehicle | null
  onClose: () => void
}

export function PbVehicleSheet({ vehicle, onClose }: PbVehicleSheetProps) {
  return (
    <PbDetailSheet
      open={!!vehicle}
      onOpenChange={(open) => { if (!open) onClose() }}
      title="Detalhes do Veículo"
    >
      {vehicle && (
        <>
          {/* Profile header */}
          <div className="mb-6 flex flex-col items-center border-b border-border pb-5 text-center">
            <PbAvatar name={vehicle.plate} active={vehicle.active} size="lg" />
            <h3 className="mt-3 text-lg font-bold text-[#003062]">{vehicle.plate}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
            <div className="mt-2">
              <PbStatusBadge active={vehicle.active} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Dados do Veículo */}
            <PbDetailSection title="Dados do Veículo">
              <div className="grid grid-cols-2 gap-3">
                <PbDetailField label="RENAVAM" value={vehicle.registrationCode} />
                <PbDetailField label="Chassi" value={vehicle.chassis} />
                <PbDetailField label="Cor" value={vehicle.color} />
                <PbDetailField label="RNTRC" value={vehicle.rntrc} />
                <PbDetailField label="Ano Fabricação" value={vehicle.manufacturingYear} />
                <PbDetailField label="Ano Modelo" value={vehicle.modelYear} />
              </div>
            </PbDetailSection>

            {/* Especificações */}
            <PbDetailSection title="Especificações">
              <div className="grid grid-cols-2 gap-3">
                <PbDetailField label="Tipo Rodado" value={getWheelTypeLabel(vehicle.wheelType)} />
                <PbDetailField label="Tipo Carroceria" value={getBodyTypeLabel(vehicle.bodyType)} />
                <PbDetailField label="Tara" value={formatWeight(vehicle.tareWeight)} />
                <PbDetailField label="Capacidade de Carga" value={formatWeight(vehicle.loadCapacity)} />
              </div>
            </PbDetailSection>

            {/* Fretefy */}
            <PbDetailSection title="Sincronização Fretefy" highlighted>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-green-500" />
                    <span className="text-[11px] font-semibold text-foreground">Cadastrado</span>
                  </div>
                </div>
              </div>
            </PbDetailSection>

            {/* Observações */}
            {vehicle.notes && (
              <PbDetailSection title="Observações">
                <p className="text-[11px] italic text-muted-foreground">{vehicle.notes}</p>
              </PbDetailSection>
            )}
          </div>
        </>
      )}
    </PbDetailSheet>
  )
}
