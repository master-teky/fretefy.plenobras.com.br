import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("dkron")

export async function registerDkronJobs(): Promise<void> {
  const dkronUrl = process.env.DKRON_URL
  const cronSecret = process.env.CRON_SECRET
  const appUrl = process.env.APP_BASE_URL ?? "http://localhost:3000"

  if (!dkronUrl) {
    log.warn("DKRON_URL não configurada, pulando registro de jobs")
    return
  }

  const jobs = [
    {
      name: "sync-erp-fretefy",
      schedule: process.env.SYNC_CRON ?? "0 */6 * * *",
      endpoint: "/api/cron/sync",
    },
  ]

  for (const job of jobs) {
    try {
      await fetch(`${dkronUrl}/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: job.name,
          schedule: job.schedule,
          timezone: "America/Sao_Paulo",
          executor: "http",
          executor_config: {
            method: "POST",
            url: `${appUrl}${job.endpoint}?secret=${encodeURIComponent(cronSecret ?? "")}`,
            body: "{}",
            timeout: "120",
            expectCode: "200",
          },
          retries: 2,
          disabled: false,
        }),
      })

      log.info({ job: job.name }, "Job registrado com sucesso")
    } catch (error) {
      log.warn(
        { job: job.name, error: error instanceof Error ? error.message : String(error) },
        "Falha ao registrar job"
      )
    }
  }
}