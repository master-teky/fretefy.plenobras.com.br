import { createLogger } from "@/lib/PbLoggerLib"
import {
  FRETEFY_EVENT_TYPE_CODES,
  type FretefyWebhookPayload,
  type FretefyWebhookData,
} from "@/types/PbFretefyWebhookType"
import { upsertShipment, insertShipmentEvent } from "@/server/repositories/PbShipmentEventRepository"
import { findInvoiceByNumber } from "@/server/repositories/PbInvoiceRepository"
import { insertFretefyEvent } from "@/server/repositories/PbFretefyEventRepository"

const log = createLogger("webhook-service")

const SERIES_REGEX = /FPe:\s*FRTFY\s+\S+-([\p{L}\d]{1,2})/iu

function extractSeriesFromObservacao(obs: string | null | undefined): string | null {
  if (!obs) return null
  const match = obs.match(SERIES_REGEX)
  const raw = match?.[1]?.trim()
  return raw ? raw : null
}

const EVENT_DESCRIPTIONS: Record<FretefyWebhookPayload["type"], string> = {
  "carga.formada": "Carga formada",
  "carga.alocada": "Carga alocada",
  "carga.evento": "Evento de carga",
  "carga.finalizada": "Carga finalizada",
  "carga.desativada": "Carga desativada",
}

export async function processWebhookEvent(payload: FretefyWebhookPayload): Promise<void> {
  const { type, data, id, timestamp } = payload
  const shipmentId = data.CargaId ?? id
  const occurredAt = new Date(timestamp)
  const rawPayload = JSON.stringify(data)

  log.info({ eventType: type, shipmentId }, "Processando evento de webhook")

  await recordFretefyEvent(payload)

  /*switch (type) {
    case "carga.formada":
      await handleCargaFormada(shipmentId, data, occurredAt, rawPayload)
      break
    case "carga.alocada":
      await handleCargaAlocada(shipmentId, data, occurredAt, rawPayload)
      break
    case "carga.evento":
      await handleCargaEvento(shipmentId, data, occurredAt, rawPayload)
      break
    case "carga.finalizada":
      await handleCargaFinalizada(shipmentId, data, occurredAt, rawPayload)
      break
    case "carga.desativada":
      await handleCargaDesativada(shipmentId, data, occurredAt, rawPayload)
      break
  }*/
}

async function recordFretefyEvent(payload: FretefyWebhookPayload): Promise<void> {
  const { type, data, timestamp } = payload
  const shipmentId = data.CargaId
  if (!shipmentId) {
    log.warn({ eventType: type }, "Evento sem CargaId — FretefyEvento ignorado")
    return
  }

  const eventCode = FRETEFY_EVENT_TYPE_CODES[type]
  const createdAt = new Date(timestamp)
  const description = EVENT_DESCRIPTIONS[type]
  const notes = JSON.stringify(data).slice(0, 3000)

  const identifiers = collectInvoiceIdentifiers(data)

  if (identifiers.length === 0) {
    log.warn({ eventType: type, shipmentId }, "Evento sem identificadores de NF — FretefyEvento ignorado")
    return
  }

  const series = extractSeriesFromObservacao(data.Observacao)
  if (!series) {
    log.warn(
      { eventType: type, shipmentId },
      "Observacao sem padrão FP3:FRTFY ...-Série — FretefyEvento ignorado",
    )
    return
  }

  for (const identifier of identifiers) {
    const invoiceNumber = parseInvoiceNumber(identifier)
    if (invoiceNumber === null) {
      log.warn({ eventType: type, identifier }, "CodigoIdentificador não numérico — pulando")
      continue
    }

    const invoice = await findInvoiceByNumber(invoiceNumber)
    if (!invoice) {
      log.warn({ eventType: type, invoiceNumber }, "NFiscal não encontrada para CodigoIdentificador")
      continue
    }

    await insertFretefyEvent({
      invoiceId: invoiceNumber,
      invoiceNumber: invoice.invoiceNumber,
      series,
      orderId: invoice.orderId,
      eventType: eventCode,
      shipmentId,
      description,
      createdAt,
      identifier,
      notes,
    })

    log.info(
      { eventType: type, shipmentId, invoiceNumber, orderId: invoice.orderId },
      "FretefyEvento registrado",
    )
  }
}

function collectInvoiceIdentifiers(data: FretefyWebhookData): string[] {
  const result: string[] = []
  if (data.CodigoIdentificador) {
    result.push(data.CodigoIdentificador)
  }
  if (data.Documentos) {
    for (const doc of data.Documentos) {
      const value = doc.NotaFiscal ?? doc.Documento
      if (value) result.push(value)
    }
  }
  return result
}

function parseInvoiceNumber(raw: string): number | null {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : null
}

async function handleCargaFormada(
  shipmentId: string,
  _data: FretefyWebhookPayload["data"],
  occurredAt: Date,
  rawPayload: string,
) {
  await upsertShipment({
    id: shipmentId,
    status: "formada",
  })

  await insertShipmentEvent({
    shipmentId,
    eventType: "carga.formada",
    description: "Carga formada",
    occurredAt,
    rawPayload,
  })

  log.info({ shipmentId }, "Carga formada registrada")
}

async function handleCargaAlocada(
  shipmentId: string,
  data: FretefyWebhookPayload["data"],
  occurredAt: Date,
  rawPayload: string,
) {
  const driverName = data.Motorista?.Nome
  const driverDocument = data.Motorista?.Documento
  const vehiclePlate = data.Veiculo?.Placa?.Numero

  await upsertShipment({
    id: shipmentId,
    status: "alocada",
    driverName,
    driverDocument,
    vehiclePlate,
  })

  const description = driverName
    ? `Alocada para ${driverName} - ${vehiclePlate ?? "sem placa"}`
    : "Carga alocada"

  await insertShipmentEvent({
    shipmentId,
    eventType: "carga.alocada",
    description,
    occurredAt,
    rawPayload,
  })

  log.info({ shipmentId, driver: driverName, plate: vehiclePlate }, "Carga alocada registrada")
}

async function handleCargaEvento(
  shipmentId: string,
  data: FretefyWebhookPayload["data"],
  occurredAt: Date,
  rawPayload: string,
) {
  await upsertShipment({
    id: shipmentId,
    status: "em_transito",
  })

  const eventOccurredAt = data.DhEvento ? new Date(data.DhEvento) : occurredAt
  const localityLabel = [data.Localidade?.Cidade, data.Localidade?.UF].filter(Boolean).join("/")
  const description = data.Descricao
    ? `${data.Descricao}${localityLabel ? ` - ${localityLabel}` : ""}`
    : null

  await insertShipmentEvent({
    shipmentId,
    eventType: "carga.evento",
    description,
    occurredAt: eventOccurredAt,
    rawPayload,
  })

  log.info({ shipmentId, eventDesc: data.Descricao }, "Evento de carga registrado")
}

async function handleCargaFinalizada(
  shipmentId: string,
  data: FretefyWebhookPayload["data"],
  occurredAt: Date,
  rawPayload: string,
) {
  await upsertShipment({
    id: shipmentId,
    status: "finalizada",
  })

  await insertShipmentEvent({
    shipmentId,
    eventType: "carga.finalizada",
    description: "Carga finalizada",
    occurredAt,
    rawPayload,
  })

  log.info({ shipmentId, data }, "Carga finalizada registrada")
}

async function handleCargaDesativada(
  shipmentId: string,
  data: FretefyWebhookPayload["data"],
  occurredAt: Date,
  rawPayload: string,
) {
  await upsertShipment({
    id: shipmentId,
    status: "desativada",
  })

  await insertShipmentEvent({
    shipmentId,
    eventType: "carga.desativada",
    description: "Carga desativada",
    occurredAt,
    rawPayload,
  })

  log.info({ shipmentId, data }, "Carga desativada registrada")
}
