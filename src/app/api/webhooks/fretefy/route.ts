"use server"

import { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/PbEnvLib"
import { createLogger } from "@/lib/PbLoggerLib"
import { fretefyWebhookPayloadSchema } from "@/types/PbFretefyWebhookType"
import { processWebhookEvent } from "@/server/services/PbWebhookService"

const log = createLogger("webhook")

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("Authorization")
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null

  const raw = await request.json()

  log.info({ raw }, "Payload do webhook inválido")

  if (token !== env.WEBHOOK_SECRET) {
    log.error("Segredo do webhook inválido recebido")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {

    const parsed = fretefyWebhookPayloadSchema.safeParse(raw)

    if (!parsed.success) {
      log.warn({ errors: parsed.error.issues, raw }, "Payload do webhook inválido")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const payload = parsed.data

    log.info(
      { eventType: payload.type, eventId: payload.id, timestamp: payload.timestamp },
      "Evento de webhook recebido",
    )

    await processWebhookEvent(payload)

    return NextResponse.json({ received: true })
  } catch (error) {
    log.error({ error }, "Falha ao processar payload do webhook")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
