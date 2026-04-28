import pino from "pino"

const isProduction = process.env.NODE_ENV === "production"
// @ts-ignore
const isEdge = typeof globalThis.EdgeRuntime === "string"
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

const RETENTION_DAYS = 30

function dateStr(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function buildLogger(): pino.Logger {
  if (isEdge || isBuildPhase) {
    return pino({ level: isProduction ? "info" : "debug" })
  }

  const path = require("path") as typeof import("path")
  const fs = require("fs") as typeof import("fs")

  const logsDir = path.resolve(process.cwd(), "logs")
  fs.mkdirSync(logsDir, { recursive: true })

  const fileFor = (d: string) => path.join(logsDir, `app.${d}.log`)
  let currentDate = dateStr()

  const destination = pino.destination({
    dest: fileFor(currentDate),
    mkdir: true,
    sync: false,
  })

  process.on("SIGHUP", () => destination.reopen())

  const checkRotation = () => {
    const today = dateStr()
    if (today !== currentDate) {
      currentDate = today
      destination.reopen(fileFor(currentDate))
      pruneOldLogs(logsDir, fs)
    }
  }

  setInterval(checkRotation, 60_000).unref()
  pruneOldLogs(logsDir, fs)

  return pino(
    {
      level: isProduction ? "info" : "debug",
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
    },
    destination,
  )
}

function pruneOldLogs(logsDir: string, fs: typeof import("fs")) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const cutoffStr = dateStr(cutoff)
  try {
    for (const name of fs.readdirSync(logsDir)) {
      const match = name.match(/^app\.(\d{4}-\d{2}-\d{2})\.log$/)
      if (match && match[1] < cutoffStr) {
        fs.unlinkSync(`${logsDir}/${name}`)
      }
    }
  } catch {
    // ignore prune errors
  }
}

export const logger = buildLogger()

export function createLogger(context: string) {
  return logger.child({ context })
}
