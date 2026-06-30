import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { getDb } from "@/server/db"
import { findFretefyTypes } from "@/server/repositories/PbFretefyTypeRepository"
import { FretefyTypeCode } from "@/types/PbFretefyType"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("health")

export async function GET() {
  const [db, fretefy] = await Promise.all([checkDatabase(), checkFretefy()])

  const allOk = db.ok && fretefy.ok
  const status = allOk ? "ok" : "degraded"
  const httpStatus = allOk ? 200 : 503

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: db,
        fretefy,
      },
    },
    { status: httpStatus },
  )
}

async function checkDatabase(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now()
  try {
    const db = await getDb()
    await db.execute(sql`SELECT 1`)
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error({ error: message }, "Falha no health check do banco de dados")
    return { ok: false, latencyMs: Date.now() - start, error: message }
  }
}

async function checkFretefy(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now()
  try {
    await findFretefyTypes(FretefyTypeCode.TipoVeiculo)
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error({ error: message }, "Falha no health check do Fretefy")
    return { ok: false, latencyMs: Date.now() - start, error: message }
  }
}