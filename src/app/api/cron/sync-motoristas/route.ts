import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncMotoristas } from "@/server/services/sync-motoristas";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Cron-Secret");

  if (secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncMotoristas();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] sync-motoristas failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}