import { env } from "@/lib/env";

interface DkronJob {
  name: string;
  schedule: string;
  executor: string;
  executor_config: Record<string, string>;
}

async function upsertJob(job: DkronJob): Promise<void> {
  const response = await fetch(`${env.DKRON_URL}/v1/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Dkron upsert failed for ${job.name}: ${response.status} ${body}`);
  }
}

export async function registerDkronJobs(): Promise<void> {
  const jobs: DkronJob[] = [
    {
      name: "sync-drivers",
      schedule: env.SYNC_MOTORISTAS_CRON,
      executor: "http",
      executor_config: {
        method: "POST",
        url: `${env.APP_BASE_URL}/api/cron/sync-drivers`,
        headers: JSON.stringify({ "X-Cron-Secret": env.CRON_SECRET }),
      },
    },
    {
      name: "sync-vehicles",
      schedule: env.SYNC_VEICULOS_CRON,
      executor: "http",
      executor_config: {
        method: "POST",
        url: `${env.APP_BASE_URL}/api/cron/sync-vehicles`,
        headers: JSON.stringify({ "X-Cron-Secret": env.CRON_SECRET }),
      },
    },
  ];

  for (const job of jobs) {
    try {
      await upsertJob(job);
      console.log(
        JSON.stringify({
          level: "info",
          context: "dkron",
          message: `Job registered: ${job.name}`,
        })
      );
    } catch (error) {
      console.warn(
        JSON.stringify({
          level: "warn",
          context: "dkron",
          message: `Failed to register job: ${job.name}`,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}