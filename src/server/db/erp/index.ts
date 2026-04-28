import { drizzle } from "drizzle-orm/node-mssql"
import * as sql from "mssql"
import * as customer from "./schema/customer"
import * as driver from "./schema/driver"
import * as fretefyEvent from "./schema/fretefy-event"
import * as invoice from "./schema/invoice"
import * as municipality from "./schema/municipality"
import * as order from "./schema/order"
import * as orderItem from "./schema/order-item"
import * as orderStatus from "./schema/order-status"
import * as vehicle from "./schema/vehicle"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("database:erp")

const schema = { ...customer, ...driver, ...fretefyEvent, ...invoice, ...municipality, ...order, ...orderItem, ...orderStatus, ...vehicle }

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDb | undefined
let poolInstance: sql.ConnectionPool | null = null
let connectPromise: Promise<sql.ConnectionPool> | null = null

function getPoolConfig(): sql.config {
  const { env } = require("@/lib/PbEnvLib") as { env: import("@/lib/PbEnvLib").Env }
  return {
    server: env.ERP_DB_HOST,
    port: Number(env.ERP_DB_PORT),
    user: env.ERP_DB_USER,
    password: env.ERP_DB_PASSWORD,
    database: env.ERP_DB_NAME,
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

export async function getErpDb(): Promise<DrizzleDb> {
  if (_db && poolInstance?.connected) return _db

  if (!connectPromise) {
    poolInstance = new sql.ConnectionPool(getPoolConfig())
    connectPromise = poolInstance.connect().then((pool) => {
      log.info("Conexão com banco ERP estabelecida")
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

export async function closeErpPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.close()
    poolInstance = null
    connectPromise = null
    _db = undefined
    log.info("Pool de conexões ERP fechado")
  }
}
