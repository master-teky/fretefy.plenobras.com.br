import { db } from "@/server/db";
import { mdfeMotoristas } from "@/server/db/schema/motorista";
import { fretefy } from "./fretefy-client";

interface SyncResult {
  total: number;
  synced: number;
  errors: number;
}

export async function syncMotoristas(): Promise<SyncResult> {
  const motoristas = await db.select().from(mdfeMotoristas);
  let synced = 0;
  let errors = 0;

  for (const motorista of motoristas) {
    try {
      await fretefy.createMotorista({
        nome: motorista.nome,
        documento: motorista.documento,
        numeroCNH: motorista.numeroCNH ?? "",
        celular: motorista.celular ?? "",
      });
      synced++;
    } catch (error) {
      errors++;
      console.error(
        JSON.stringify({
          level: "error",
          context: "sync-motoristas",
          documento: motorista.documento,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  const result: SyncResult = { total: motoristas.length, synced, errors };
  console.log(JSON.stringify({ level: "info", context: "sync-motoristas", ...result }));
  return result;
}