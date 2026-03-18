import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

interface FretefyWebhookPayload {
  id: string;
  timestamp: string;
  type: string;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Webhook-Secret");

  if (secret !== env.WEBHOOK_SECRET) {
    console.error("[webhook] Invalid secret received");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as FretefyWebhookPayload;

    console.log(
      JSON.stringify({
        level: "info",
        context: "webhook",
        eventType: payload.type,
        eventId: payload.id,
        timestamp: payload.timestamp,
        data: payload.data,
      })
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] Failed to process payload:", error);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}