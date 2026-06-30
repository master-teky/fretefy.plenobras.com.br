import { fretefyHttp } from "@/lib/PbFretefyLib"
import type { FretefyCargoDetail, FretefyOfertaCargaInput, FretefyOfertaCargaResult } from "@/types/PbFretefyType"
import cacheService from "@/server/services/PbCacheService"

const TEN_MINUTES_CARGO_TTL = 10 * 60

export async function createCargoOffer(payload: FretefyOfertaCargaInput): Promise<FretefyOfertaCargaResult> {
  return fretefyHttp.post<FretefyOfertaCargaResult>("/ofertacarga", {
    body: JSON.stringify(payload),
    headers: { IgnorarContratacao: "true" },
  })
}

export async function deleteCargoOffer(id: string): Promise<void> {
  return fretefyHttp.delete(`/carga/${id}`)
}

export async function getCargo(id: string): Promise<FretefyCargoDetail> {
  return cacheService.withCache(`fretefy:cargo:${id}`, TEN_MINUTES_CARGO_TTL, () =>
    fretefyHttp.get<FretefyCargoDetail>(`/carga/${id}`)
  )
}