export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerDkronJobs } = await import("@/server/services/dkron");
    registerDkronJobs().catch((error) => {
      console.warn("[startup] Dkron registration failed, continuing:", error);
    });
  }
}