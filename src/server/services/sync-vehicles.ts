import { db } from "@/server/db";
import { mdfeVehicles } from "@/server/db/schema/vehicle";
import { eq } from "drizzle-orm";
import { fretefy } from "./fretefy-client";

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
      console.error(
        JSON.stringify({
          level: "error",
          context: "sync-vehicles",
          placa: vehicle.plate,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  const result: SyncResult = { total: vehicles.length, synced, errors };
  console.log(JSON.stringify({ level: "info", context: "sync-vehicles", ...result }));
  return result;
}