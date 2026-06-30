import { z } from "zod/v4"

export const SHIPMENT_EVENT_TYPES = [
  "carga.formada",
  "carga.alocada",
  "carga.evento",
  "carga.finalizada",
  "carga.desativada",
] as const

export type ShipmentEventType = (typeof SHIPMENT_EVENT_TYPES)[number]

export const FRETEFY_EVENT_TYPE_CODES: Record<ShipmentEventType, number> = {
  "carga.formada": 1,
  "carga.alocada": 2,
  "carga.evento": 3,
  "carga.finalizada": 4,
  "carga.desativada": 5,
}

const attachmentSchema = z.object({
  ContentType: z.string().nullable(),
  StoragePath: z.string().nullable(),
  Content: z.string().nullable(),
}).passthrough()

const localitySchema = z.object({
  Localidade: z.string().nullable(),
  Cidade: z.string().nullable(),
  UF: z.string().nullable(),
  Latitude: z.number().nullable(),
  Longitude: z.number().nullable(),
}).passthrough()

const carrierSchema = z.object({
  Id: z.string(),
  Nome: z.string(),
  Documento: z.string(),
}).passthrough()

const driverSchema = z.object({
  Id: z.string().nullable(),
  Nome: z.string().nullable(),
  Documento: z.string().nullable(),
}).passthrough()

const vehicleSchema = z.object({
  Id: z.string().nullable(),
  Placa: z.object({ Numero: z.string() }).passthrough().nullable(),
  Frota: z.string().nullable().optional(),
  TipoVeiculoId: z.string().nullable(),
  TipoCarroceriaId: z.string().nullable(),
}).passthrough()

const documentSchema = z.object({
  PedidoId: z.string().nullable().optional(),
  Documento: z.string().nullable().optional(),
  NotaFiscal: z.string().nullable().optional(),
  Referencia: z.string().nullable().optional(),
  Serie: z.string().nullable().optional(),
  Numero: z.number().int().nullable().optional(),
}).passthrough()

const formationSchema = z.object({
  Revertida: z.boolean(),
}).passthrough()

export const fretefyWebhookPayloadSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(SHIPMENT_EVENT_TYPES),
  data: z.object({
    CargaId: z.string().optional(),
    CodigoIdentificador: z.string().nullable().optional(),
    Id: z.string().optional(),
    RotaId: z.string().optional(),
    CodigoEDI: z.string().nullable().optional(),
    TipoEvento: z.number().int().optional(),
    TipoAcaoEvento: z.number().int().optional().nullable(),
    TarefaId: z.string().nullable().optional(),
    Descricao: z.string().optional(),
    DhEvento: z.string().optional(),
    CodigoIdentificadorRota: z.string().nullable().optional(),
    TipoOcorrenciaId: z.string().nullable().optional(),
    DescricaoRota: z.string().optional(),
    Observacao: z.string().nullable().optional(),
    Localidade: localitySchema.optional(),
    Anexo: attachmentSchema.nullable().optional(),
    Anexos: z.array(attachmentSchema).optional(),
    Pedidos: z.array(z.unknown()).optional(),
    Referencias: z.array(z.unknown()).optional(),
    DhAlocacao: z.string().optional(),
    Transportador: carrierSchema.optional(),
    Veiculo: vehicleSchema.optional(),
    Motorista: driverSchema.optional(),
    Equipamentos: z.unknown().nullable().optional(),
    Frete: z.unknown().optional(),
    Rotas: z.array(z.unknown()).optional(),

    MotivoId: z.string().nullable().optional(),
    Documentos: z.array(documentSchema).optional(),
    Formacao: formationSchema.optional(),
  }).passthrough(),
})

export type FretefyWebhookPayload = z.infer<typeof fretefyWebhookPayloadSchema>
export type FretefyWebhookData = FretefyWebhookPayload["data"]
export type FretefyWebhookDocument = z.infer<typeof documentSchema>
