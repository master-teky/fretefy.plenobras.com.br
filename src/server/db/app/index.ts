import { drizzle } from "drizzle-orm/node-mssql"
import * as sql from "mssql"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("database:app")

import * as shipment from "./schema/shipment"
import * as shipmentEvent from "./schema/shipment-event"

const schema = { ...shipment, ...shipmentEvent }

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDb | undefined
let poolInstance: sql.ConnectionPool | null = null
let connectPromise: Promise<sql.ConnectionPool> | null = null

function getPoolConfig(): sql.config {
  const { env } = require("@/lib/PbEnvLib") as { env: import("@/lib/PbEnvLib").Env }
  if (!env.APP_DB_HOST || !env.APP_DB_USER || !env.APP_DB_PASSWORD || !env.APP_DB_NAME) {
    throw new Error("AppDb desabilitado nesta fase — variáveis APP_DB_* não configuradas")
  }
  return {
    server: env.APP_DB_HOST,
    port: Number(env.APP_DB_PORT),
    user: env.APP_DB_USER,
    password: env.APP_DB_PASSWORD,
    database: env.APP_DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  }
}

export async function getAppDb(): Promise<DrizzleDb> {
  if (_db && poolInstance?.connected) return _db

  if (!connectPromise) {
    poolInstance = new sql.ConnectionPool(getPoolConfig())
    connectPromise = poolInstance.connect().then((pool) => {
      log.info("Conexão com banco App estabelecida")
      return pool
    }).catch((error) => {
      connectPromise = null
      poolInstance = null
      throw error
    })
  }

  const pool = await connectPromise
  if (!_db) {
    _db = drizzle(pool, { schema })
  }
  return _db
}

export async function closeAppPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.close()
    poolInstance = null
    connectPromise = null
    _db = undefined
    log.info("Pool de conexões App fechado")
  }
}
