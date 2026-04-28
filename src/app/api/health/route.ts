import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { getErpDb } from "@/server/db/erp"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("health")

export async function GET() {
  const erp = await checkErpDatabase()

  const status = erp.ok ? "ok" : "degraded"
  const httpStatus = erp.ok ? 200 : 503

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        erpDatabase: erp,
      },
    },
    { status: httpStatus },
  )
}

async function checkErpDatabase(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now()
  try {
    const db = await getErpDb()
    await db.execute(sql`SELECT 1`)
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error({ error: message }, "Falha no health check do banco ERP")
    return { ok: false, latencyMs: Date.now() - start, error: message }
  }
}
