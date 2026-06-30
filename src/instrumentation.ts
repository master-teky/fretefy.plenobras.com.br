export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { createLogger } = await import("@/lib/PbLoggerLib")
    const log = createLogger("startup")

    const { getFretefyTypes } = await import("@/server/services/PbFretefyTypesService")
    getFretefyTypes().catch((error) => {
      log.warn({ error }, "Cache inicial de tipos do Fretefy falhou, continuando")
    })

    const { registerDkronJobs } = await import("@/server/services/PbDkronService")
    registerDkronJobs().catch((error) => {
      log.warn({ error }, "Registro do Dkron falhou, continuando")
    })

    const { closePool } = await import("@/server/db")
    process.on("SIGINT", async () => {
      log.info("Encerrando aplicação, fechando pools de conexão...")
      await closePool()
      process.exit(0)
    })
    process.on("SIGTERM", async () => {
      log.info("Encerrando aplicação, fechando pools de conexão...")
      await closePool()
      process.exit(0)
    })
  }
}
