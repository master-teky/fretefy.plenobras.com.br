import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { createLogger } from "@/lib/PbLoggerLib"
import { PbS3StorageLib } from "@/lib/PbS3StorageLib"
import { findAttachmentsByEventId } from "@/server/repositories/PbFretefyEventAttachmentRepository"

const log = createLogger("download-file")

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const eventIdParam = request.nextUrl.searchParams.get("eventId")
  const eventId = eventIdParam ? Number(eventIdParam) : NaN

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Parâmetro eventId inválido" }, { status: 400 })
  }

  const attachments = await findAttachmentsByEventId(eventId)
  const attachment = attachments[0]

  if (!attachment) {
    log.warn({ eventId }, "Nenhum anexo encontrado para o evento")
    return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 })
  }

  log.info({ eventId, attachmentId: attachment.id, url: attachment.url }, "Iniciando download de anexo")

  const { stream, contentType, contentLength, fileName } = await PbS3StorageLib.streamObject(attachment.url)

  return new Response(stream, {
    headers: {
      "Content-Type": attachment.contentType || contentType,
      "Content-Disposition": `${(attachment.contentType || contentType).startsWith("image/") ? "inline" : "attachment"}; filename="${attachment.fileName ?? fileName}"`,
      "Content-Length": String(attachment.size || contentLength),
    },
  })
}
