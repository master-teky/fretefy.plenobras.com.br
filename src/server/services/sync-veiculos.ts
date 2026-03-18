import { db } from "@/server/db";
import { mdfeVeiculos } from "@/server/db/schema/veiculo";
import { fretefy } from "./fretefy-client";

interface SyncResult {
  total: number;
  synced: number;
  errors: number;
}

export async function syncVeiculos(): Promise<SyncResult> {
  const veiculos = await db.select().from(mdfeVeiculos);
  let synced = 0;
  let errors = 0;

  for (const veiculo of veiculos) {
    try {
      await fretefy.createVeiculo({
        placa: veiculo.placa,
        rNTRC: veiculo.rntrc ?? "",
        tipoVeiculoId: veiculo.tipoVeiculo ?? "",
        tipoCarroceriaId: veiculo.tipoCarroceria ?? "",
      });
      synced++;
    } catch (error) {
      errors++;
      console.error(
        JSON.stringify({
          level: "error",
          context: "sync-veiculos",
          placa: veiculo.placa,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  const result: SyncResult = { total: veiculos.length, synced, errors };
  console.log(JSON.stringify({ level: "info", context: "sync-veiculos", ...result }));
  return result;
}