import { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/PbEnvLib"
import { createLogger } from "@/lib/PbLoggerLib"
import { syncFretefyTracks } from "@/server/services/PbCargoOfferService"

const log = createLogger("sync-fretefy-tracks")

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Cron-Secret") ?? request.nextUrl.searchParams.get("secret")

  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    await syncFretefyTracks()

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error({ error: message }, "Falha ao criar oferta de carga no Fretefy")
    return NextResponse.json({ error: message }, { status: 500 })
  }
}