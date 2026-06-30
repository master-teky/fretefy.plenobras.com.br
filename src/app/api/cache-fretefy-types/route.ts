import { createLogger } from "@/lib/PbLoggerLib"
import { env } from "@/lib/PbEnvLib"
import { NextRequest, NextResponse } from "next/server"
import { getFretefyTypes } from "@/server/services/PbFretefyTypesService"

const log = createLogger("cache-fretefy-types")

export async function POST(request: NextRequest) {
    const secret = request.headers.get("X-Cron-Secret") ?? request.nextUrl.searchParams.get("secret")

    if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    try {
        await getFretefyTypes()
        return NextResponse.json({ ok: true })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log.error({ error }, `Falha ao criar cache de tipos do Fretefy: ${message}`)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}