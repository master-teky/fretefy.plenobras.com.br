import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { env } from "@/lib/PbEnvLib"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("storage:s3")

export type PbS3StreamResult = {
  stream: ReadableStream<Uint8Array>
  contentType: string
  contentLength: number
  fileName: string
}

export type PbS3UploadParams = {
  key: string
  body: Buffer | Uint8Array
  contentType: string
  contentLength: number
}

export type PbS3UploadResult = {
  url: string
  key: string
  size: number
}

export type PbS3EventAttachmentKeyArgs = {
  shipmentId: string
  webhookEventId: string
  index: number
  fileName: string
}

let _client: S3Client | null = null

function getClient(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: env.AWS_REGION,
    followRegionRedirects: true,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  })
  return _client
}

function buildCanonicalUrl(key: string): string {
  const bucket = env.S3_BUCKET_NAME
  const region = env.AWS_REGION
  const encodedKey = key.split("/").map(encodeURIComponent).join("/")
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`
}

function sanitizeFileNameSegment(value: string): string {
  const normalized = value.normalize("NFD").replace(/[̀-ͯ]/g, "")
  const cleaned = normalized
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
  return cleaned || "anexo"
}

export class PbS3StorageLib {
  static async uploadObject(params: PbS3UploadParams): Promise<PbS3UploadResult> {
    const client = getClient()
    const bucket = env.S3_BUCKET_NAME

    log.debug(
      { key: params.key, contentType: params.contentType, size: params.contentLength },
      "Iniciando upload para S3",
    )

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        ContentLength: params.contentLength,
      }),
    )

    const url = buildCanonicalUrl(params.key)
    log.info({ key: params.key, size: params.contentLength }, "Objeto enviado para S3")
    return { url, key: params.key, size: params.contentLength }
  }

  private static keyFromUrl(url: string): string {
    const { pathname } = new URL(url)
    return pathname.replace(/^\//, "")
  }

  static async streamObject(url: string): Promise<PbS3StreamResult> {
    const client = getClient()
    const bucket = env.S3_BUCKET_NAME
    const key = PbS3StorageLib.keyFromUrl(url)

    log.debug({ key }, "Iniciando stream do S3")

    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    )

    if (!response.Body) throw new Error(`Objeto não encontrado no S3: ${key}`)

    const stream = response.Body.transformToWebStream() as ReadableStream<Uint8Array>
    const contentType = response.ContentType ?? "application/octet-stream"
    const contentLength = response.ContentLength ?? 0
    const fileName = key.split("/").pop() ?? "arquivo"

    log.info({ key, size: contentLength }, "Stream do S3 iniciado")

    return { stream, contentType, contentLength, fileName }
  }

  static buildEventAttachmentKey(args: PbS3EventAttachmentKeyArgs): string {
    const safeFile = sanitizeFileNameSegment(args.fileName)
    const safeShipment = sanitizeFileNameSegment(args.shipmentId)
    const safeEvent = sanitizeFileNameSegment(args.webhookEventId)
    return `fretefy/eventos/${safeShipment}/${safeEvent}-${args.index}-${safeFile}`
  }
}
