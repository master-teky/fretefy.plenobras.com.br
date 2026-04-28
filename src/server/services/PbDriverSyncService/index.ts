import { findActiveDrivers, createFretefyDriver } from "@/server/repositories/PbDriverRepository"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("sync-drivers")

const usedPhones = new Set<string>()

function generateRandomMobile(): string {
  let phone: string
  do {
    const number = Math.floor(Math.random() * 100_000_000)
      .toString()
      .padStart(8, "0")
    phone = `519${number}`
  } while (usedPhones.has(phone))
  usedPhones.add(phone)
  return phone
}

interface SyncResult {
  total: number
  synced: number
  errors: number
}

export async function syncDrivers(): Promise<SyncResult> {
  const drivers = await findActiveDrivers()
  let synced = 0
  let errors = 0

  for (const driver of drivers) {
    try {
      await createFretefyDriver({
        nome: driver.name,
        documento: driver.taxId,
        numeroCNH: driver.registrationNumber,
        celular: generateRandomMobile(),
        visibilidade: '1'
      })
      synced++
    } catch (error) {
      errors++
      log.error(
        { cpf: driver.taxId, error: error instanceof Error ? error.message : String(error) },
        "Erro ao sincronizar motorista"
      )
    }
  }

  const result: SyncResult = { total: drivers.length, synced, errors }
  log.info(result, "Sincronização de motoristas concluída")
  return result
}
