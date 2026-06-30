"use client"

import type { MdfeDriver } from "@/server/db/schema/driver"
import { PbDetailSheet, PbDetailSection, PbDetailField } from "@/components/shared/PbDetailSheet"
import { PbAvatar } from "@/components/shared/PbAvatar"
import { PbStatusBadge } from "@/components/shared/PbStatusBadge"

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

interface PbDriverSheetProps {
  driver: MdfeDriver | null
  onClose: () => void
}

export function PbDriverSheet({ driver, onClose }: PbDriverSheetProps) {
  return (
    <PbDetailSheet
      open={!!driver}
      onOpenChange={(open) => { if (!open) onClose() }}
      title="Detalhes do Motorista"
    >
      {driver && (
        <>
          {/* Profile header */}
          <div className="mb-6 flex flex-col items-center border-b border-border pb-5 text-center">
            <PbAvatar name={driver.name} active={driver.active} size="lg" />
            <h3 className="mt-3 text-lg font-bold text-[#003062]">{driver.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">CPF: {formatTaxId(driver.taxId)}</p>
            <div className="mt-2">
              <PbStatusBadge active={driver.active} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Dados Pessoais */}
            <PbDetailSection title="Dados Pessoais">
              <div className="grid grid-cols-2 gap-3">
                <PbDetailField label="Data Nascimento" value={formatDate(driver.birthDate)} />
                <PbDetailField label="RG" value={driver.identityCard} />
                <PbDetailField label="Órgão Emissor" value={driver.issuingAuthority} />
                <PbDetailField label="Nacionalidade" value={driver.nationality} />
              </div>
            </PbDetailSection>

            {/* CNH */}
            <PbDetailSection title="Habilitação (CNH)">
              <div className="grid grid-cols-2 gap-3">
                <PbDetailField label="Número CNH" value={driver.registrationNumber} />
                <PbDetailField label="Categoria" value={driver.category} />
                <PbDetailField label="1ª Habilitação" value={formatDate(driver.firstLicenseDate)} />
                <PbDetailField label="Emissão" value={formatDate(driver.issueDate)} />
                <PbDetailField
                  label="Validade"
                  value={formatDate(driver.expirationDate)}
                  danger={isExpired(driver.expirationDate)}
                  success={!isExpired(driver.expirationDate)}
                  className="col-span-2"
                />
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
            {driver.notes && (
              <PbDetailSection title="Observações">
                <p className="text-[11px] italic text-muted-foreground">{driver.notes}</p>
              </PbDetailSection>
            )}
          </div>
        </>
      )}
    </PbDetailSheet>
  )
}
