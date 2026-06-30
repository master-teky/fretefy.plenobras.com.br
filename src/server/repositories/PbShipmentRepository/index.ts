import { fretefyHttp } from "@/lib/PbFretefyLib"
import type { FretefyShipment, FretefyTrackingItem, FretefyType } from "@/types/PbFretefyType"

export async function getShipment(id: string): Promise<FretefyShipment> {
  return fretefyHttp.get<FretefyShipment>(`/carga/${id}`)
}

export async function listShipments(params?: {
  situacao?: number
  dhReferenciaInicio?: string
  dhReferenciaFim?: string
}): Promise<FretefyShipment[]> {
  const searchParams = new URLSearchParams()
  if (params?.situacao !== undefined) searchParams.set("situacaoOfertaCarga", String(params.situacao))
  if (params?.dhReferenciaInicio) searchParams.set("dhReferenciaInicio", params.dhReferenciaInicio)
  if (params?.dhReferenciaFim) searchParams.set("dhReferenciaFim", params.dhReferenciaFim)
  const qs = searchParams.toString()
  return fretefyHttp.get<FretefyShipment[]>(`/carga${qs ? `?${qs}` : ""}`)
}

export async function getTracking(params?: {
  id?: string
  numero?: string
  pedido?: string
}): Promise<FretefyTrackingItem[]> {
  const searchParams = new URLSearchParams()
  if (params?.id) searchParams.set("id", params.id)
  if (params?.numero) searchParams.set("numero", params.numero)
  if (params?.pedido) searchParams.set("pedido", params.pedido)
  const qs = searchParams.toString()
  return fretefyHttp.get<FretefyTrackingItem[]>(`/tracking${qs ? `?${qs}` : ""}`)
}

export async function getTypes(type: number): Promise<FretefyType[]> {
  return fretefyHttp.get<FretefyType[]>(`/tipos/${type}`)
}