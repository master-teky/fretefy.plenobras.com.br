export interface FretefyDriver {
  id: string
  nome: string
  documento: string
  numeroCNH: string
  celular: string
  visibilidade?: string
  dataNascimento?: string
}

export interface FretefyDriverInput {
  nome: string
  documento: string
  numeroCNH: string
  celular: string
  visibilidade?: string
}

export interface FretefyVehicle {
  id: string
  placa: string
  rNTRC: string
  tipoVeiculoId: string
  tipoCarroceriaId: string
  frota?: string
  propriedade?: string
}

export interface FretefyVehicleInput {
  placa: string
  rNTRC: string
  tipoVeiculoId: string
  tipoCarroceriaId: string
  propriedade?: string
}

export interface FretefyShipment {
  id: string
  situacao: number
  eventos: FretefyShipmentEvent[]
  motorista?: FretefyDriver
  veiculo?: FretefyVehicle
}

export interface FretefyShipmentEvent {
  tipo: string
  dhEvento: string
  descricao: string
  localidade?: string
}

export interface FretefyTrackingItem {
  situacao: number
  dhColeta?: string
  dhEntrega?: string
  eventos: FretefyShipmentEvent[]
}

export interface FretefyType {
  id: string
  descricao: string
  tipo: number
}