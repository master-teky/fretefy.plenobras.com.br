import { createLogger } from "@/lib/PbLoggerLib"
import { findFretefyTypes } from "@/server/repositories/PbFretefyTypeRepository"
import { FretefyTypeCode, type FretefyType } from "@/types/PbFretefyType"
import cacheService from "@/server/services/PbCacheService"

const log = createLogger("PbFretefyTypesService")

const TWENTY_FOUR_HOURS_TTL = 60 * 60 * 24

export type FretefyTypes = {
    tiposVeiculo:    FretefyType[]
    tiposCarroceria: FretefyType[]
    tiposCarga:      FretefyType[]
    tiposTarifa:     FretefyType[]
}

export async function getFretefyTypes(): Promise<FretefyTypes> {
    const [tiposVeiculo, tiposCarroceria, tiposCarga, tiposTarifa] = await Promise.all([
        cacheService.withCache<FretefyType[]>("fretefy:tipos:veiculo", TWENTY_FOUR_HOURS_TTL, () => findFretefyTypes(FretefyTypeCode.TipoVeiculo).then(r => r[0]!)),
        cacheService.withCache<FretefyType[]>("fretefy:tipos:carroceria", TWENTY_FOUR_HOURS_TTL, () => findFretefyTypes(FretefyTypeCode.TipoCarroceria).then(r => r[0]!)),
        cacheService.withCache<FretefyType[]>("fretefy:tipos:carga", TWENTY_FOUR_HOURS_TTL, () => findFretefyTypes(FretefyTypeCode.TipoCarga).then(r => r[0]!)),
        cacheService.withCache<FretefyType[]>("fretefy:tipos:tarifa", TWENTY_FOUR_HOURS_TTL, () => findFretefyTypes(FretefyTypeCode.TipoTarifa).then(r => r[0]!)),
    ])

    log.info({
        tiposVeiculo: tiposVeiculo.length,
        tiposCarroceria: tiposCarroceria.length,
        tiposCarga: tiposCarga.length,
        tiposTarifa: tiposTarifa.length,
    }, "Tipos do Fretefy resolvidos")

    return { tiposVeiculo, tiposCarroceria, tiposCarga, tiposTarifa }
}