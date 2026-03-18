import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncVeiculos } from "@/server/services/sync-veiculos";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Cron-Secret");

  if (secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncVeiculos();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] sync-veiculos failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}