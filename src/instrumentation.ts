import { createLogger } from "@/lib/PbLoggerLib";

const log = createLogger("startup");

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerDkronJobs } = await import("@/server/services/dkron");
    registerDkronJobs().catch((error) => {
      log.warn({ error }, "Registro do Dkron falhou, continuando");
    });
  }
}