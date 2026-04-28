import {
  findActiveVehicles,
  createFretefyVehicle,
  getFretefyVehicleTypes,
  getFretefyBodyTypes,
} from "@/server/repositories/PbVehicleRepository"
import { createLogger } from "@/lib/PbLoggerLib"
import type { FretefyType } from "@/types/PbFretefyType"

const log = createLogger("sync-vehicles")

// wheelType (TipoRodado MDFe) → descrição no Fretefy vehicleTypes
const WHEEL_TYPE_TO_VEHICLE: Record<string, string> = {
  "01": "Truck",
  "02": "Toco",
  "03": "Carreta",
  "04": "Van",
  "05": "Furgao",
  "06": "Toco",
}
const DEFAULT_VEHICLE_TYPE = "Toco"

// bodyType (TipoCarroceria MDFe) → descrição no Fretefy bodyTypes
const BODY_TYPE_MAP: Record<string, string> = {
  "00": "Baú",
  "01": "Grade Baixa",
  "02": "Baú",
  "03": "Graneleiro",
  "04": "Bug Porta Conteiner",
  "05": "Sider",
}
const DEFAULT_BODY_TYPE = "Baú"

function findTypeByDescription(types: FretefyType[], description: string): string | null {
  const match = types.find(
    (t) => t.descricao.toLowerCase().includes(description.toLowerCase())
      || description.toLowerCase().includes(t.descricao.toLowerCase())
  )
  return match?.id ?? null
}

interface SyncResult {
  total: number
  synced: number
  errors: number
  skipped: number
}

export async function syncVehicles(): Promise<SyncResult> {
  const [vehicles, vehicleTypes, bodyTypes] = await Promise.all([
    findActiveVehicles(),
    getFretefyVehicleTypes(),
    getFretefyBodyTypes(),
  ])

  log.info(
    { vehicleTypes: vehicleTypes.map((t) => ({ id: t.id, desc: t.descricao })),
      bodyTypes: bodyTypes.map((t) => ({ id: t.id, desc: t.descricao })) },
    "Tipos carregados da Fretefy"
  )

  let synced = 0
  let errors = 0
  let skipped = 0

  for (const vehicle of vehicles) {
    try {
      const vehicleTypeDesc = vehicle.wheelType
        ? (WHEEL_TYPE_TO_VEHICLE[vehicle.wheelType] ?? DEFAULT_VEHICLE_TYPE)
        : DEFAULT_VEHICLE_TYPE

      const bodyTypeDesc = vehicle.bodyType
        ? (BODY_TYPE_MAP[vehicle.bodyType] ?? DEFAULT_BODY_TYPE)
        : DEFAULT_BODY_TYPE

      const tipoVeiculoId = findTypeByDescription(vehicleTypes, vehicleTypeDesc)
      const tipoCarroceriaId = findTypeByDescription(bodyTypes, bodyTypeDesc)

      if (!tipoVeiculoId) {
        log.warn(
          { placa: vehicle.plate, wheelType: vehicle.wheelType, desc: vehicleTypeDesc },
          "Tipo de veículo sem correspondência na Fretefy, pulando"
        )
        skipped++
        continue
      }

      await createFretefyVehicle({
        placa: vehicle.plate,
        rNTRC: vehicle.rntrc ?? "142536589",
        tipoVeiculoId,
        tipoCarroceriaId: tipoCarroceriaId ?? "",
        propriedade: "1"
      })
      synced++
    } catch (error) {
      errors++
      log.error(
        { placa: vehicle.plate, error: error instanceof Error ? error.message : String(error) },
        "Erro ao sincronizar veículo"
      )
    }
  }

  const result: SyncResult = { total: vehicles.length, synced, errors, skipped }
  log.info(result, "Sincronização de veículos concluída")
  return result
}