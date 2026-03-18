import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncDrivers } from "@/server/services/sync-drivers";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Cron-Secret");

  if (secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncDrivers();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] sync-drivers failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}