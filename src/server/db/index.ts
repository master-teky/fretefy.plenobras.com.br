import { drizzle } from "drizzle-orm/node-mssql"
import * as sql from "mssql"
import * as customer from "./schema/customer"
import * as driver from "./schema/driver"
import * as fretefyEvent from "./schema/fretefy-event"
import * as fretefyEventAttachment from "./schema/fretefy-event-attachment"
import * as invoice from "./schema/invoice"
import * as mdfe from "./schema/mdfe"
import * as mdfeControl from "./schema/mdfe-control"
import * as mdfeFiscalNotes from "./schema/mdfe-fiscal-notes"
import * as mdfeHistory from "./schema/mdfe-history"
import * as mdfeManifestVehicles from "./schema/mdfe-manifest-vehicles"
import * as mdfeStatus from "./schema/mdfe-status"
import * as municipality from "./schema/municipality"
import * as order from "./schema/order"
import * as orderItem from "./schema/order-item"
import * as orderStatus from "./schema/order-status"
import * as vehicle from "./schema/vehicle"
import * as fretefyStatusCarga from "./schema/fretefy-status-carga"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("database")

const schema = { ...customer, ...driver, ...fretefyEvent, ...fretefyEventAttachment, ...fretefyStatusCarga, ...invoice, ...mdfe, ...mdfeControl, ...mdfeFiscalNotes, ...mdfeHistory, ...mdfeManifestVehicles, ...mdfeStatus, ...municipality, ...order, ...orderItem, ...orderStatus, ...vehicle }

type DrizzleDb = ReturnType<typeof drizzle<typeof schema, sql.ConnectionPool>>

let _db: DrizzleDb | undefined
let poolInstance: sql.ConnectionPool | null = null
let connectPromise: Promise<sql.ConnectionPool> | null = null

function getPoolConfig(): sql.config {
  const { env } = require("@/lib/PbEnvLib") as { env: import("@/lib/PbEnvLib").Env }
  return {
    server: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
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

export async function getDb(): Promise<DrizzleDb> {
  if (_db && poolInstance?.connected) return _db

  if (!connectPromise) {
    poolInstance = new sql.ConnectionPool(getPoolConfig())
    connectPromise = poolInstance.connect().then((pool) => {
      log.info("Conexão com banco de dados estabelecida")
      return pool
    }).catch((error) => {
      connectPromise = null
      poolInstance = null
      throw error
    })
  }

  const pool = await connectPromise
  if (!_db) {
    _db = drizzle({ client: pool, schema })
  }
  return _db
}

export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.close()
    poolInstance = null
    connectPromise = null
    _db = undefined
    log.info("Pool de conexões fechado")
  }
}