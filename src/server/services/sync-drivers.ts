import { db } from "@/server/db";
import { mdfeDrivers } from "@/server/db/schema/driver";
import { eq } from "drizzle-orm";
import { fretefy } from "./fretefy-client";

interface SyncResult {
  total: number;
  synced: number;
  errors: number;
}

export async function syncDrivers(): Promise<SyncResult> {
  const drivers = await db
    .select()
    .from(mdfeDrivers)
    .where(eq(mdfeDrivers.active, true));

  let synced = 0;
  let errors = 0;

  for (const driver of drivers) {
    try {
      await fretefy.createDriver({
        nome: driver.name,
        documento: driver.taxId,
        numeroCNH: driver.registrationNumber,
        celular: "",
      });
      synced++;
    } catch (error) {
      errors++;
      console.error(
        JSON.stringify({
          level: "error",
          context: "sync-drivers",
          cpf: driver.taxId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  const result: SyncResult = { total: drivers.length, synced, errors };
  console.log(JSON.stringify({ level: "info", context: "sync-drivers", ...result }));
  return result;
}