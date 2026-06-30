import {createLogger} from "@/lib/PbLoggerLib"
import {fretefyHttp} from "@/lib/PbFretefyLib"
import {PbS3StorageLib} from "@/lib/PbS3StorageLib"
import {
    FRETEFY_EVENT_TYPE_CODES,
    type FretefyWebhookPayload,
    type FretefyWebhookData,
} from "@/types/PbFretefyWebhookType"
import {type FretefyCargoDetail} from "@/types/PbFretefyType"
import {getCargo} from "@/server/repositories/PbCargoOfferRepository"
import {findByTrackingNumber, deleteByTrackingNumber} from "@/server/repositories/PbFretefyStatusCargaRepository"
import cacheService from "@/server/services/PbCacheService"
import {findInvoiceByNumber} from "@/server/repositories/PbInvoiceRepository"
import {
    existsFretefyEvent,
    existsFretefyEventByInvoice,
    insertFretefyEvent,
} from "@/server/repositories/PbFretefyEventRepository"
import { insertFretefyEventAttachment } from "@/server/repositories/PbFretefyEventAttachmentRepository"

const log = createLogger("webhook-service")

const EVENT_DESCRIPTIONS: Record<FretefyWebhookPayload["type"], string> = {
    "carga.formada": "Carga formada",
    "carga.alocada": "Carga alocada",
    "carga.evento": "Evento de carga",
    "carga.finalizada": "Carga finalizada",
    "carga.desativada": "Carga desativada",
}

const SERIES_REGEX = /FPe:\s*FRTFY\s+\S+-([\p{L}\d]{1,2})/iu

function extractSeriesFromObservacao(obs: string | null | undefined): string | null {
    if (!obs) return null
    const match = obs.match(SERIES_REGEX)
    const raw = match?.[1]?.trim()
    return raw ? raw : null
}

export async function processWebhookEvent(payload: FretefyWebhookPayload): Promise<void> {
    const {type, data, id} = payload
    const shipmentId = data.CargaId ?? id

    log.info({eventType: type, shipmentId}, "Processando evento de webhook")

    const cargo = await resolveCargoFromCache(data.CargaId)

    if (!cargo) {
        log.warn({shipmentId}, "carga.evento sem detalhe da carga disponível — ignorado")
        return
    }

    const eventIds = await recordFretefyEvent(payload)
    if (eventIds.length > 0) await persistAttachments(payload, eventIds)

    const isOurTrack = cargo.paradas.some((p) => p.documentos.length > 0)

    if (isOurTrack) {
        log.info("Identificada carga sincronizada pela API.")
        switch (type) {
            // case "carga.formada":
            // await handleCargaFormada(shipmentId, data, occurredAt, rawPayload)
            // break
            // case "carga.alocada":
            //   await handleCargaAlocada(shipmentId, data, occurredAt, rawPayload)
            //   break
            case "carga.evento":
                await handleCargaEvento(id, shipmentId, data, cargo)
                break
            case "carga.finalizada":
                await handleCargaFinalizada(data)
                break
            case "carga.desativada":
              await handleCargaDesativada(data)
              break
        }
    }
}

async function resolveCargoFromCache(cargaId: string | undefined): Promise<FretefyCargoDetail | null> {
    if (!cargaId) return null

    try {
        return await cacheService.withCache<FretefyCargoDetail>(
            `fretefy:cargo:${cargaId}`,
            300,
            () => getCargo(cargaId),
        )
    } catch (e) {
        log.warn({cargaId}, "Falha ao consultar carga — prosseguindo sem cache")
        return null
    }
}

async function handleCargaEvento(
    webhookEventId: string,
    shipmentId: string,
    data: FretefyWebhookData,
    cargo: FretefyCargoDetail,
): Promise<void> {
    const rotaId = data.RotaId
    const eventCode = FRETEFY_EVENT_TYPE_CODES["carga.evento"]
    const description = EVENT_DESCRIPTIONS["carga.evento"]
    const notes = JSON.stringify(data).slice(0, 3000)
    const createdAt = new Date()
    const eventIds: number[] = []

    let documentos: FretefyCargoDetail["paradas"][0]["documentos"]

    if (cargo.coleta.id === rotaId) {
        log.info({shipmentId, rotaId}, "carga.evento para coleta — registrando para todas as NFs da carga")
        documentos = cargo.paradas.flatMap((p) => p.documentos)
    } else if (cargo.entrega.id === rotaId) {
        log.info({shipmentId, rotaId}, "carga.evento para entrega — registrando para todas as NFs da carga")
        documentos = cargo.paradas.flatMap((p) => p.documentos)
    } else {
        const parada = cargo.paradas.find((p) => p.id === rotaId)
        if (!parada) {
            log.warn({shipmentId, rotaId}, "carga.evento: RotaId não encontrado em nenhuma parada — ignorado")
            return
        }
        documentos = parada.documentos
    }

    for (const doc of documentos) {
        const invoiceNumber = Number(doc.notaFiscal)
        if (!invoiceNumber || isNaN(invoiceNumber)) {
            log.warn({shipmentId, rotaId, notaFiscal: doc.notaFiscal}, "Documento com notaFiscal inválida — pulando")
            continue
        }

        const invoice = await findInvoiceByNumber(invoiceNumber)
        if (!invoice) {
            log.warn({shipmentId, rotaId, invoiceNumber}, "NFiscal não encontrada — pulando")
            continue
        }

        const alreadyExists = await existsFretefyEvent({ invoiceNumber: invoice.invoiceNumber, series: invoice.series, eventType: eventCode })
        if (alreadyExists) {
            log.info({shipmentId, rotaId, invoiceNumber, series: invoice.series}, "FretefyEvento já existente — pulando")
            continue
        }

        const eventId = await insertFretefyEvent({
            invoiceId: invoiceNumber,
            invoiceNumber: invoice.invoiceNumber,
            series: invoice.series,
            orderId: invoice.orderId,
            eventType: eventCode,
            shipmentId,
            description,
            createdAt,
            identifier: doc.notaFiscal,
            notes,
        })

        eventIds.push(eventId)
        log.info({shipmentId, rotaId, invoiceNumber, eventId}, "FretefyEvento registrado")
    }

    const attachments = collectAttachments(data)
    if (attachments.length === 0 || eventIds.length === 0) return

    log.info({shipmentId, rotaId, totalAnexos: attachments.length}, "Persistindo anexos do evento")

    for (let index = 0; index < attachments.length; index++) {
        const att = attachments[index]!
        const storagePath = att.StoragePath
        if (!storagePath) continue

        try {
            const downloaded = await fretefyHttp.downloadAttachment(storagePath)
            const contentType = downloaded.contentType || att.ContentType || "application/octet-stream"
            const fileName = downloaded.fileName ?? `anexo-${index}`

            const key = PbS3StorageLib.buildEventAttachmentKey({shipmentId, webhookEventId, index, fileName})
            const uploaded = await PbS3StorageLib.uploadObject({
                key,
                body: downloaded.buffer,
                contentType,
                contentLength: downloaded.size,
            })

            const attachmentCreatedAt = new Date()
            for (const eventId of eventIds) {
                await insertFretefyEventAttachment({
                    eventId,
                    url: uploaded.url,
                    contentType,
                    size: downloaded.size,
                    fileName: downloaded.fileName,
                    createdAt: attachmentCreatedAt,
                })
            }

            log.info({shipmentId, rotaId, key: uploaded.key, size: downloaded.size}, "Anexo persistido")
        } catch (error) {
            log.error({error, storagePath, shipmentId, rotaId, index}, "Falha ao persistir anexo — seguindo")
        }
    }
}

async function handleCargaFinalizada(data: FretefyWebhookData): Promise<void> {
    const cargaId = data.CargaId
    if (!cargaId) {
        log.warn("carga.finalizada sem CargaId — ignorado")
        return
    }

    const registros = await findByTrackingNumber(cargaId)
    if (registros.length === 0) {
        log.warn({cargaId}, "carga.finalizada: nenhum registro em FretefyStatusCarga — ignorado")
        return
    }

    log.info({cargaId, total: registros.length}, "Registrando evento de finalização para as NFs vinculadas")

    const eventCode = FRETEFY_EVENT_TYPE_CODES["carga.finalizada"]
    const description = EVENT_DESCRIPTIONS["carga.finalizada"]
    const createdAt = new Date()
    const notes = JSON.stringify(data).slice(0, 3000)

    for (const registro of registros) {
        const alreadyExists = await existsFretefyEvent({ invoiceNumber: registro.invoiceNumber, series: registro.series, eventType: eventCode })
        if (alreadyExists) {
            log.info({
                cargaId,
                invoiceNumber: registro.invoiceNumber,
                series: registro.series
            }, "FretefyEvento já existente — pulando")
            continue
        }

        const invoice = await findInvoiceByNumber(registro.invoiceNumber)
        if (!invoice) {
            log.warn({cargaId, invoiceNumber: registro.invoiceNumber}, "NFiscal não encontrada — pulando")
            continue
        }

        const eventId = await insertFretefyEvent({
            invoiceId: registro.invoiceNumber,
            invoiceNumber: invoice.invoiceNumber,
            series: registro.series,
            orderId: invoice.orderId,
            eventType: eventCode,
            shipmentId: cargaId,
            description,
            createdAt,
            identifier: String(registro.invoiceNumber),
            notes,
        })

        log.info({cargaId, invoiceNumber: registro.invoiceNumber, eventId}, "FretefyEvento de finalização registrado")
    }
}

async function handleCargaDesativada(data: FretefyWebhookData): Promise<void> {
    const cargaId = data.CargaId
    if (!cargaId) {
        log.warn("carga.desativada sem CargaId — ignorado")
        return
    }

    await deleteByTrackingNumber(cargaId)
    log.info({cargaId}, "Registros de FretefyStatusCarga removidos para carga desativada")
}

async function recordFretefyEvent(payload: FretefyWebhookPayload): Promise<number[]> {
  const { type, data, timestamp } = payload
  const shipmentId = data.CargaId
  if (!shipmentId) {
    log.warn({ eventType: type }, "Evento sem CargaId — FretefyEvento ignorado")
    return []
  }

  const eventCode = FRETEFY_EVENT_TYPE_CODES[type]
  const createdAt = new Date(timestamp)
  const description = EVENT_DESCRIPTIONS[type]
  const notes = JSON.stringify(data).slice(0, 3000)

  const identifiers = collectInvoiceIdentifiers(data)

  if (identifiers.length === 0) {
    log.warn({ eventType: type, shipmentId }, "Evento sem identificadores de NF — FretefyEvento ignorado")
    return []
  }

  const series = extractSeriesFromObservacao(data.Observacao)
  if (!series) {
    log.warn(
      { eventType: type, shipmentId },
      "Observacao sem padrão FP3:FRTFY ...-Série — FretefyEvento ignorado",
    )
    return []
  }

  const eventIds: number[] = []

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

    const alreadyExists = await existsFretefyEventByInvoice(invoice.invoiceNumber, series)
    if (alreadyExists) {
      log.info(
        { eventType: type, invoiceNumber: invoice.invoiceNumber, series },
        "FretefyEvento já existente para NumNF/Serie — pulando",
      )
      continue
    }

    const eventId = await insertFretefyEvent({
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

    eventIds.push(eventId)

    log.info(
      { eventType: type, shipmentId, invoiceNumber, orderId: invoice.orderId, eventId },
      "FretefyEvento registrado",
    )
  }

  return eventIds
}

type WebhookAttachment = {
  ContentType: string | null
  StoragePath: string | null
  Content: string | null
}

function collectAttachments(data: FretefyWebhookData): WebhookAttachment[] {
  const list: WebhookAttachment[] = []
  if (data.Anexo) list.push(data.Anexo as WebhookAttachment)
  if (data.Anexos) {
    for (const att of data.Anexos) list.push(att as WebhookAttachment)
  }
  return list.filter((att) => Boolean(att.StoragePath))
}

async function persistAttachments(
  payload: FretefyWebhookPayload,
  eventIds: number[],
): Promise<void> {
  const { data, id: webhookEventId } = payload
  const shipmentId = data.CargaId
  if (!shipmentId) return

  const attachments = collectAttachments(data)
  if (attachments.length === 0) return

  log.info(
    { webhookEventId, shipmentId, total: attachments.length, eventCount: eventIds.length },
    "Iniciando persistência de anexos do webhook",
  )

  for (let index = 0; index < attachments.length; index++) {
    const att = attachments[index]
    const storagePath = att.StoragePath
    if (!storagePath) continue

    try {
      const downloaded = await fretefyHttp.downloadAttachment(storagePath)
      const contentType = downloaded.contentType || att.ContentType || "application/octet-stream"
      const fileName = downloaded.fileName ?? `anexo-${index}`

      const key = PbS3StorageLib.buildEventAttachmentKey({
        shipmentId,
        webhookEventId,
        index,
        fileName,
      })

      const uploaded = await PbS3StorageLib.uploadObject({
        key,
        body: downloaded.buffer,
        contentType,
        contentLength: downloaded.size,
      })

      const createdAt = new Date()
      for (const eventId of eventIds) {
        await insertFretefyEventAttachment({
          eventId,
          url: uploaded.url,
          contentType,
          size: downloaded.size,
          fileName: downloaded.fileName,
          createdAt,
        })
      }

      log.info(
        {
          webhookEventId,
          shipmentId,
          key: uploaded.key,
          size: downloaded.size,
          linkedEvents: eventIds.length,
        },
        "Anexo persistido",
      )
    } catch (error) {
      log.error(
        { error, storagePath, webhookEventId, shipmentId, index },
        "Falha ao persistir anexo — seguindo",
      )
    }
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