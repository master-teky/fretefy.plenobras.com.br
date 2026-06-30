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
      schedule: process.env.SYNC_CRON ?? "0 0 */6 * * *",
      endpoint: "/api/cron/sync",
    },
    {
      name: "sync-fretefy-tracks",
      schedule: process.env.SYNC_TRACKS_CRON ?? "0 */30 * * * *",
      endpoint: "/api/sync-fretefy-tracks",
    },
    {
      name: "cache-fretefy-types",
      schedule: process.env.CACHE_FRETEFY_TYPES_CRON,
      endpoint: "/api/cache-fretefy-types",
    },
  ]

  for (const job of jobs) {
    try {
      const response = await fetch(`${dkronUrl}/v1/jobs`, {
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

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        log.error(
          { job: job.name, status: response.status, body },
          "Dkron recusou o registro do job"
        )
        continue
      }

      log.info({ job: job.name }, "Job registrado com sucesso")
    } catch (error) {
      log.warn(
        { job: job.name, error: error instanceof Error ? error.message : String(error) },
        "Falha ao registrar job"
      )
    }
  }
}