import { fretefyHttp } from "@/lib/PbFretefyLib"
import type { FretefyCargoDetail, FretefyCargoSituacaoCode } from "@/types/PbFretefyType"

function toFretefyDateTime(date: Date): string {
    const localDate = new Date(date.getTime() - 3 * 60 * 60 * 1000)
    return localDate.toISOString().slice(0, 19) + "-03:00"
}

export async function getFretefyTracks(filters?: {
    situation?: FretefyCargoSituacaoCode
    startAt?: Date | null
    endAt?: Date | null
}): Promise<FretefyCargoDetail[]> {
    const parts: string[] = []

    if (filters?.situation != null) parts.push(`situacao=${filters.situation}`)
    if (filters?.startAt) parts.push(`dhReferenciaInicio=${toFretefyDateTime(filters.startAt)}`)
    if (filters?.endAt) parts.push(`dhReferenciaFim=${toFretefyDateTime(filters.endAt)}`)

    const query = parts.length > 0 ? `?${parts.join("&")}` : ""

    return fretefyHttp.get<FretefyCargoDetail[]>(`/carga${query}`)
}