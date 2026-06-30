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

export const FretefyCargoSituacao = {
  EmAberto: 1,
  EmAndamento: 2,
  Ofertada: 3,
  Finalizada: 4,
  Cancelada: 5,
  ComOcorrencia: 7,
  EntreguesNaoFinalizadas: 8,
  Desativada: 99,
} as const

export type FretefyCargoSituacaoCode = typeof FretefyCargoSituacao[keyof typeof FretefyCargoSituacao]

export const FretefyCargoSituacaoLabel: Record<number, string> = {
  1: "Em aberto",
  2: "Em andamento",
  3: "Ofertada",
  4: "Finalizada",
  5: "Cancelada",
  7: "Com ocorrência",
  8: "Entregues não finalizadas",
  99: "Desativada",
}

export const FretefyTypeCode = {
  TipoVeiculo: 1,
  TipoCarroceria: 2,
  TipoCarga: 8,
  TipoTarifa: 10,
} as const

export interface FretefyEmpresa {
  documento: string
  razaoSocial: string
  endereco: string
  cidade: string
  uf: string
}

export interface FretefyOrigem {
  localidade: string
  cidade: string
  uf: string
  dhInicio: string
  motivo: number
  empresa: FretefyEmpresa
}

export interface FretefyDocumento {
  Chave: string
  Serie: string
  Numero: number
  Emitente: FretefyEmpresa
  Destinatario: FretefyEmpresa
}

export interface FretefyDestino {
  localidade: string
  cidade: string
  uf: string
  motivo: number
  empresa: FretefyEmpresa
  documentos: FretefyDocumento[]
}

export interface FretefyCarga {
  unidadeMedida: number
  modalidade: number
  pesoBruto: number
  valorCarga: number
  tipoFrete: string
  tipoCargaId: string
  pedidoEmbarcador: string
}

export interface FretefyVeiculoRequisito {
  apenasCavaloMecanico: boolean
  tiposVeiculo: string[]
  tiposCarrocerias: string[]
}

export interface FretefyPagamento {
  tipoTarifaId: string
  valorFrete: number
}

export interface FretefyAlocacao {
  veiculo: { placa: string }
  motorista: { nome: string; documento: string }
}

export interface FretefyOfertaCargaInput {
  unidadeNegocioId: string
  origem: FretefyOrigem
  destino: FretefyDestino
  paradas: FretefyDestino[]
  carga: FretefyCarga
  veiculo: FretefyVeiculoRequisito
  pagamento: FretefyPagamento
  alocacao: FretefyAlocacao | null
  observacao: string
  visibilidade: number
}

export interface FretefyOfertaCargaResult {
  id: string
  situacao?: number
}

export interface FretefyLocalidadeResult {
  localidade: string
  cidade: string
  uf: string
  latitude: number | null
  longitude: number | null
}

export interface FretefyEmpresaResult {
  id: string
  documento: string
  nome: string
  localidade: FretefyLocalidadeResult
  codigoIdentificador: string | null
}

export interface FretefyTransportadorResult {
  id: string
  documento: string
  nome: string
}

export interface FretefyEmpresaEntregaResult {
  nomeEmpresa: string
  cnpj: { numero: string }
  inscricaoEstadual: string | null
  empresaId: string | null
  localidade: string | null
  cidade: string | null
  uf: string | null
  email: string | null
  telefone: string | null
  latitude: number | null
  longitude: number | null
  googlePlaceId: string | null
}

export interface FretefyDocumentoResult {
  id: string
  documento: string | null
  notaFiscal: string
  agrupador: string | null
  empresaColeta: string | null
  ufColeta: string | null
  cidadeColeta: string | null
  enderecoColeta: string | null
  latitudeColeta: number | null
  longitudeColeta: number | null
  dhCriacaoPedido: string
  dhColeta: string
  empresaEntrega: FretefyEmpresaEntregaResult
  ufEntrega: string
  cidadeEntrega: string
  enderecoEntrega: string
  latitudeEntrega: number
  longitudeEntrega: number
  dhEntrega: string | null
  cubagemTotal: number
  pesoTotal: number
  acondicionamentoId: string
  valorTotal: number
  quantidade: number
  itens: unknown | null
  observacoes: string | null
  unidadeNegocioId: string
  lote: boolean
  referencia: string | null
  tipoFrete: number
  dhEmissao: string
  emitenteDocumento: string
  caracteristica: unknown | null
  transportadora: unknown | null
  vendedor: unknown | null
  vendedorModel: unknown | null
  chave: string | null
  possuiRedespacho: boolean
  transportadoraRedespachoId: string | null
  localidadeRedespacho: unknown | null
  camposAdicionais: unknown | null
}

export interface FretefyParadaResult {
  id: string
  cargaId: string
  grupoTarefaId: string | null
  localidade: FretefyLocalidadeResult
  dhInicio: string | null
  dhFim: string | null
  motivo: number
  pedidoEmbarcador: string | null
  concluida: boolean
  situacao: number
  dhUltimoEvento: string | null
  eventoRota: unknown | null
  tarefas: unknown[]
  empresa: FretefyEmpresaResult
  documentos: FretefyDocumentoResult[]
}

export interface FretefyCargoDetail {
  id: string
  codigo: string
  identificador: string
  dhColeta: string | null
  dhEntrega: string | null
  dhCriacao: string
  dhModificacao: string
  situacaoOfertaCarga: number
  eventos: FretefyShipmentEvent[]
  ocorrencias: unknown[]
  veiculo: { placa: string; frota: string }
  posicao: {
    dhPosicao: string | null
    latitude: number | null
    longitude: number | null
    localidade: string | null
    velocidadeMedia: number | null
  }
  equipamentos: unknown[]
  motorista: { nome: string; documento: string }
  coleta: FretefyParadaResult
  entrega: FretefyParadaResult
  paradas: FretefyParadaResult[]
  remetente: FretefyEmpresaResult
  tomador: FretefyEmpresaResult
  transportador: FretefyTransportadorResult
  carga: {
    unidadeMedida: string | null
    modalidade: string
    pesoBruto: number
    valorCarga: number
    quantidade: number | null
    volume: number | null
    distancia: number
    tipoCarga: string
    tipoFrete: string
    camposAdicionais: unknown[]
  }
  caracteristica: unknown | null
  observacao: string
  frete: {
    sugerido: number
    contratado: number
    oferecimentoRessalvas: unknown | null
  }
  conjuntoId: string | null
}