import { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/PbEnvLib"
import { syncDrivers } from "@/server/services/PbDriverSyncService"
import { syncVehicles } from "@/server/services/PbVehicleSyncService"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("cron-sync")

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Cron-Secret")
    ?? request.nextUrl.searchParams.get("secret")

  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    log.info("Iniciando sincronização ERP → Fretefy")

    const [drivers, vehicles] = await Promise.all([
      syncDrivers(),
      syncVehicles(),
    ])

    const result = { drivers, vehicles }
    log.info(result, "Sincronização concluída")

    return NextResponse.json(result)
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, "Falha na sincronização")
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}