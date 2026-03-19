import { db } from "@/server/db";
import { mdfeDrivers } from "@/server/db/schema/driver";
import { eq } from "drizzle-orm";
import { fretefy } from "./fretefy-client";
import { createLogger } from "@/lib/PbLoggerLib";

const log = createLogger("sync-drivers");

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
      log.error(
        { cpf: driver.taxId, error: error instanceof Error ? error.message : String(error) },
        "Erro ao sincronizar motorista"
      );
    }
  }

  const result: SyncResult = { total: drivers.length, synced, errors };
  log.info(result, "Sincronização de motoristas concluída");
  return result;
}