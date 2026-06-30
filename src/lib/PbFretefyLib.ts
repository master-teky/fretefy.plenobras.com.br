import { env } from "@/lib/PbEnvLib"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("fretefy-http")

export type PbFretefyDownloadResult = {
  buffer: Buffer
  contentType: string
  fileName: string | null
  size: number
}

class PbFretefyHttpClient {
  private baseUrl = ""
  private apiKey = ""

  private init() {
    if (!this.baseUrl) {
      this.baseUrl = env.FRETEFY_API_URL
      this.apiKey = env.FRETEFY_API_KEY
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path)
  }

  async post<T>(path: string, request: RequestInit): Promise<T> {
    const copy = Object.assign({}, request)
    copy.method = "POST"

    return this.request<T>(path, copy)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" })
  }

  async downloadAttachment(storagePath: string): Promise<PbFretefyDownloadResult> {
    this.init()
    const url = this.resolveUrl(storagePath)

    const response = await fetch(url, {
      headers: { Authorization: `ApiKey ${this.apiKey}` },
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      log.error({ status: response.status, url, body }, "Falha ao baixar anexo do Fretefy")
      throw new Error(`Fretefy download erro ${response.status}: ${body}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream"
    const fileName = extractFileName(response.headers.get("content-disposition"), storagePath)

    return { buffer, contentType, fileName, size: buffer.byteLength }
  }

  private resolveUrl(storagePath: string): string {
    if (/^https?:\/\//i.test(storagePath)) return storagePath
    const base = this.baseUrl.replace(/\/+$/, "")
    const suffix = storagePath.startsWith("/") ? storagePath : `/${storagePath}`
    return `${base}${suffix}`
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    this.init()
    const url = `${this.baseUrl}${path}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `ApiKey ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      log.error({ status: response.status, path, body }, "Erro na requisição à API Fretefy")
      throw new Error(`Fretefy API erro ${response.status}: ${body}`)
    }

    if (response.status === 204) return undefined as T
    const text = await response.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
  }
}

function extractFileName(contentDisposition: string | null, storagePath: string): string | null {
  if (contentDisposition) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].trim())
      } catch {
        // fallthrough to plain filename
      }
    }
    const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
    if (plainMatch?.[1]) return plainMatch[1].trim()
  }

  try {
    const url = /^https?:\/\//i.test(storagePath)
      ? new URL(storagePath)
      : new URL(storagePath, "https://placeholder.local")
    const segment = url.pathname.split("/").filter(Boolean).pop()
    if (segment) return decodeURIComponent(segment)
  } catch {
    // ignore
  }

  return null
}

export const fretefyHttp = new PbFretefyHttpClient()