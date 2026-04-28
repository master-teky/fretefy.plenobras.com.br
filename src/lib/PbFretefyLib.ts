import { env } from "@/lib/PbEnvLib"
import { createLogger } from "@/lib/PbLoggerLib"

const log = createLogger("fretefy-http")

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

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    })
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
    return response.json() as Promise<T>
  }
}

export const frtefyHttp = new PbFretefyHttpClient()