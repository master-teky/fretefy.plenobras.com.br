import { env } from "@/lib/env";

// --- Types ---

export interface FretefyDriver {
  id: string;
  nome: string;
  documento: string;
  numeroCNH: string;
  celular: string;
  visibilidade?: string;
  dataNascimento?: string;
}

export interface FretefyDriverInput {
  nome: string;
  documento: string;
  numeroCNH: string;
  celular: string;
}

export interface FretefyVehicle {
  id: string;
  placa: string;
  rNTRC: string;
  tipoVeiculoId: string;
  tipoCarroceriaId: string;
  frota?: string;
  propriedade?: string;
}

export interface FretefyVehicleInput {
  placa: string;
  rNTRC: string;
  tipoVeiculoId: string;
  tipoCarroceriaId: string;
}

export interface FretefyShipment {
  id: string;
  situacao: number;
  eventos: FretefyShipmentEvent[];
  motorista?: FretefyDriver;
  veiculo?: FretefyVehicle;
}

export interface FretefyShipmentEvent {
  tipo: string;
  dhEvento: string;
  descricao: string;
  localidade?: string;
}

export interface FretefyTrackingItem {
  situacao: number;
  dhColeta?: string;
  dhEntrega?: string;
  eventos: FretefyShipmentEvent[];
}

export interface FretefyType {
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

  // Driver
  async getDriver(documento: string): Promise<FretefyDriver> {
    return this.request<FretefyDriver>(`/motorista/${documento}`);
  }

  async createDriver(data: FretefyDriverInput): Promise<FretefyDriver> {
    return this.request<FretefyDriver>("/motorista", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Vehicle
  async getVehicle(placa: string): Promise<FretefyVehicle> {
    return this.request<FretefyVehicle>(`/veiculo/${placa}`);
  }

  async createVehicle(data: FretefyVehicleInput): Promise<FretefyVehicle> {
    return this.request<FretefyVehicle>("/veiculo", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Shipment / Tracking
  async getShipment(id: string): Promise<FretefyShipment> {
    return this.request<FretefyShipment>(`/carga/${id}`);
  }

  async listShipments(params?: {
    situacao?: number;
    dhReferenciaInicio?: string;
    dhReferenciaFim?: string;
  }): Promise<FretefyShipment[]> {
    const searchParams = new URLSearchParams();
    if (params?.situacao !== undefined) searchParams.set("situacao", String(params.situacao));
    if (params?.dhReferenciaInicio) searchParams.set("dhReferenciaInicio", params.dhReferenciaInicio);
    if (params?.dhReferenciaFim) searchParams.set("dhReferenciaFim", params.dhReferenciaFim);
    const qs = searchParams.toString();
    return this.request<FretefyShipment[]>(`/carga${qs ? `?${qs}` : ""}`);
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

  // Types
  async getTypes(tipo: number): Promise<FretefyType[]> {
    return this.request<FretefyType[]>(`/tipos/${tipo}`);
  }
}

export const fretefy = new FretefyClient();