import { db } from "@/server/db";
import { mdfeVehicles } from "@/server/db/schema/vehicle";
import { eq } from "drizzle-orm";
import { fretefy } from "./fretefy-client";
import { createLogger } from "@/lib/PbLoggerLib";

const log = createLogger("sync-vehicles");

interface SyncResult {
  total: number;
  synced: number;
  errors: number;
}

export async function syncVehicles(): Promise<SyncResult> {
  const vehicles = await db
    .select()
    .from(mdfeVehicles)
    .where(eq(mdfeVehicles.active, true));

  let synced = 0;
  let errors = 0;

  for (const vehicle of vehicles) {
    try {
      await fretefy.createVehicle({
        placa: vehicle.plate,
        rNTRC: vehicle.rntrc ?? "",
        tipoVeiculoId: vehicle.transportUnitType.toString(),
        tipoCarroceriaId: vehicle.bodyType ?? "",
      });
      synced++;
    } catch (error) {
      errors++;
      log.error(
        { placa: vehicle.plate, error: error instanceof Error ? error.message : String(error) },
        "Erro ao sincronizar veículo"
      );
    }
  }

  const result: SyncResult = { total: vehicles.length, synced, errors };
  log.info(result, "Sincronização de veículos concluída");
  return result;
}