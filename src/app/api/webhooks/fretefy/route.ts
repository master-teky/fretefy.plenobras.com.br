import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/PbEnvLib";
import { createLogger } from "@/lib/PbLoggerLib";

const log = createLogger("webhook");

interface FretefyWebhookPayload {
  id: string;
  timestamp: string;
  type: string;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Webhook-Secret");

  if (secret !== env.WEBHOOK_SECRET) {
    log.error("Segredo do webhook inválido recebido");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as FretefyWebhookPayload;

    log.info(
      { eventType: payload.type, eventId: payload.id, timestamp: payload.timestamp, data: payload.data },
      "Evento de webhook recebido"
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error({ error }, "Falha ao processar payload do webhook");
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}