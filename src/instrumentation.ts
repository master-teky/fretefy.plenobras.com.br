export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { createLogger } = await import("@/lib/PbLoggerLib")
    const log = createLogger("startup")

    const { registerDkronJobs } = await import("@/server/services/PbDkronService")
    registerDkronJobs().catch((error) => {
      log.warn({ error }, "Registro do Dkron falhou, continuando")
    })

    const { closeAllPools } = await import("@/server/db")
    process.on("SIGINT", async () => {
      log.info("Encerrando aplicação, fechando pools de conexão...")
      await closeAllPools()
      process.exit(0)
    })
    process.on("SIGTERM", async () => {
      log.info("Encerrando aplicação, fechando pools de conexão...")
      await closeAllPools()
      process.exit(0)
    })
  }
}
