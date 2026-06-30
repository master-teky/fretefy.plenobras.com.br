import { fretefyHttp } from "@/lib/PbFretefyLib"
import { FretefyTypeCode, type FretefyType } from "@/types/PbFretefyType"

type FretefyTypeCodeValue = (typeof FretefyTypeCode)[keyof typeof FretefyTypeCode]

export async function findFretefyTypes<T extends FretefyTypeCodeValue[]>(
  ...types: T
): Promise<{ [K in keyof T]: FretefyType[] }> {
  const results = await Promise.all(
    types.map((type) => fretefyHttp.get<FretefyType[]>(`/tipos/${type}`))
  )

  return results as { [K in keyof T]: FretefyType[] }
}