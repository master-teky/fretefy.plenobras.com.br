import { env } from "@/lib/env";

// --- Types ---

export interface FretefyMotorista {
  id: string;
  nome: string;
  documento: string;
  numeroCNH: string;
  celular: string;
  visibilidade?: string;
  dataNascimento?: string;
}

export interface FretefyMotoristaInput {
  nome: string;
  documento: string;
  numeroCNH: string;
  celular: string;
}

export interface FretefyVeiculo {
  id: string;
  placa: string;
  rNTRC: string;
  tipoVeiculoId: string;
  tipoCarroceriaId: string;
  frota?: string;
  propriedade?: string;
}

export interface FretefyVeiculoInput {
  placa: string;
  rNTRC: string;
  tipoVeiculoId: string;
  tipoCarroceriaId: string;
}

export interface FretefyCarga {
  id: string;
  situacao: number;
  eventos: FretefyCargaEvento[];
  motorista?: FretefyMotorista;
  veiculo?: FretefyVeiculo;
}

export interface FretefyCargaEvento {
  tipo: string;
  dhEvento: string;
  descricao: string;
  localidade?: string;
}

export interface FretefyTrackingItem {
  situacao: number;
  dhColeta?: string;
  dhEntrega?: string;
  eventos: FretefyCargaEvento[];
}

export interface FretefyTipo {
  id: string;
  descricao: string;
  tipo: number;
}

// --- Client ---

class FretefyClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = "";
    this.apiKey = "";
  }

  private init() {
    if (!this.baseUrl) {
      this.baseUrl = env.FRETEFY_API_URL;
      this.apiKey = env.FRETEFY_API_KEY;
    }
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    this.init();
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `ApiKey ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Fretefy API error ${response.status}: ${body}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  // Motorista
  async getMotorista(documento: string): Promise<FretefyMotorista> {
    return this.request<FretefyMotorista>(`/motorista/${documento}`);
  }

  async createMotorista(data: FretefyMotoristaInput): Promise<FretefyMotorista> {
    return this.request<FretefyMotorista>("/motorista", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Veiculo
  async getVeiculo(placa: string): Promise<FretefyVeiculo> {
    return this.request<FretefyVeiculo>(`/veiculo/${placa}`);
  }

  async createVeiculo(data: FretefyVeiculoInput): Promise<FretefyVeiculo> {
    return this.request<FretefyVeiculo>("/veiculo", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Carga / Tracking
  async getCarga(id: string): Promise<FretefyCarga> {
    return this.request<FretefyCarga>(`/carga/${id}`);
  }

  async listCargas(params?: {
    situacao?: number;
    dhReferenciaInicio?: string;
    dhReferenciaFim?: string;
  }): Promise<FretefyCarga[]> {
    const searchParams = new URLSearchParams();
    if (params?.situacao !== undefined) searchParams.set("situacao", String(params.situacao));
    if (params?.dhReferenciaInicio) searchParams.set("dhReferenciaInicio", params.dhReferenciaInicio);
    if (params?.dhReferenciaFim) searchParams.set("dhReferenciaFim", params.dhReferenciaFim);
    const qs = searchParams.toString();
    return this.request<FretefyCarga[]>(`/carga${qs ? `?${qs}` : ""}`);
  }

  async getTracking(params?: {
    id?: string;
    numero?: string;
    pedido?: string;
  }): Promise<FretefyTrackingItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.id) searchParams.set("id", params.id);
    if (params?.numero) searchParams.set("numero", params.numero);
    if (params?.pedido) searchParams.set("pedido", params.pedido);
    const qs = searchParams.toString();
    return this.request<FretefyTrackingItem[]>(`/tracking${qs ? `?${qs}` : ""}`);
  }

  // Tipos
  async getTipos(tipo: number): Promise<FretefyTipo[]> {
    return this.request<FretefyTipo[]>(`/tipos/${tipo}`);
  }
}

export const fretefy = new FretefyClient();