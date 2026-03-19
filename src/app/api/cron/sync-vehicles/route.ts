import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/PbEnvLib";
import { syncVehicles } from "@/server/services/sync-vehicles";
import { createLogger } from "@/lib/PbLoggerLib";

const log = createLogger("cron-sync-vehicles");

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Cron-Secret");

  if (secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncVehicles();
    return NextResponse.json(result);
  } catch (error) {
    log.error({ error }, "Falha na sincronização de veículos via cron");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}