import { mssqlTable, varchar, int, datetime, float, decimal, text, primaryKey } from "drizzle-orm/mssql-core"
import { orders } from "./order"

export const orderItems = mssqlTable("OrcamentoItem", {
  // === Identifiers ===
  orderId: int("CodOrcamento_ID").notNull().references(() => orders.id),
  productId: int("CodProduto_ID").notNull(),
  manufacturerId: varchar("CodFabricante_ID", { length: 5 }).notNull(),
  unitOfMeasure: varchar("UnidadeMedida_ID", { length: 6 }).notNull(),
  itemNumber: int("NItem").notNull(),

  // === Pricing ===
  quantity: decimal("Quantidade", { precision: 12, scale: 3 }),
  unitPrice: float("PrecoUnitario").notNull(),
  totalPrice: float("PrecoTotal").notNull(),
  discountPrice: float("PrecoDesconto").notNull(),
  discountPercent: float("PorcDesconto").notNull(),
  costPrice: float("PrecoCusto"),
  originalCostPrice: float("PrecoCustoOri"),
  discountedCostPrice: float("PrecoCustoDesc"),
  unitValue: float("ValorUnitario"),
  margin: float("Margem"),
  originalNegotiatedPrice: decimal("PrecoNegociadoOriginal", { precision: 18, scale: 3 }),
  internetDiscount: float("VlrDescInternet").notNull(),

  // === Index-based pricing ===
  indexedUnitPrice: float("PrecoUnitarioIndice"),
  priceIndex: varchar("Indice", { length: 2 }),
  indexDate: datetime("DataIndice"),
  indexValue: float("ValorIndice"),

  // === Quantities ===
  approvedQuantity: float("QtdeAprovada"),
  fulfilledQuantity: float("QtdeAtendida"),
  shortageQuantity: float("QtdeFalta"),
  minimumQuantity: float("QtdeMinima"),
  stockQuantity: float("QtdeEstoque"),
  acceptsPartial: int("AtendeParcial"),

  // === Status ===
  status: varchar("Status"),
  statusDescription: varchar("StatusDescr", { length: 50 }),
  purchaseStatus: varchar("StatusCompras", { length: 50 }),

  // === Tax — Rates ===
  ipiRate: float("IPI"),
  icmsRate: float("ICMS"),
  averageIcms: float("ICMSmedio"),
  icmFactor: float("FatorICM"),
  operationNature: varchar("NOPER", { length: 5 }).notNull(),
  taxCode: varchar("Codtributo", { length: 2 }),
  icmsBaseReduction: float("RedBaseIcms"),
  stAmount: float("VlSubTrib"),

  // === Tax — Amounts ===
  icmsBaseAmount: float("VlrBaseICMS"),
  icmsAmount: float("VlrICMS"),
  stBaseAmount: float("VlrBaseST"),
  ipiAmount: float("VlrIPI"),
  pisAmount: float("VlrPIS"),
  cofinsAmount: float("VlrCOFINS"),
  freightAmount: float("VlrFrete"),
  insuranceAmount: float("VlrSeguro"),
  otherAmount: float("VlrOutros"),

  // === Tax — DIFAL / Partilha ===
  publicEntityIcmsRate: decimal("AliqIcmOrgPub", { precision: 18, scale: 3 }),
  publicEntityIcmsDiscount: decimal("VlDescIcmOrgPub", { precision: 18, scale: 3 }),
  originIcmsPartition: decimal("VlIcmPartOri", { precision: 18, scale: 3 }),
  destinationIcmsPartition: decimal("VlIcmPartDest", { precision: 18, scale: 3 }),
  partitionBaseCalc: decimal("VlBaseCalcPartilha", { precision: 18, scale: 3 }),
  destinationStateInternalRate: decimal("AliqInternaUFDestino", { precision: 5, scale: 2 }),
  interstateRate: decimal("AliqInterestadualUFs", { precision: 5, scale: 2 }),
  provisionalDestPartitionPercent: decimal("PercProvisorioPartilhaDest", { precision: 18, scale: 3 }),

  // === Tax — FCP ===
  fcpAmount: decimal("VlFcp", { precision: 18, scale: 3 }),
  fcpIcmsPercent: decimal("PercFcpIcms", { precision: 5, scale: 2 }),
  fcpIcmsBaseCalc: decimal("VlBaseCalcFcpIcms", { precision: 18, scale: 3 }),
  fcpStPercent: decimal("PercFcpSt", { precision: 5, scale: 2 }),
  fcpStAmount: decimal("VlFcpSt", { precision: 18, scale: 3 }),
  fcpStBaseCalc: decimal("VlBaseCalcFcpSt", { precision: 18, scale: 3 }),

  // === Tax — ICMS Efetivo ===
  effectiveBaseReductionPercent: decimal("pRedBCEfet", { precision: 5, scale: 2 }),
  effectiveBaseCalc: decimal("vBCEfet", { precision: 18, scale: 3 }),
  effectiveIcmsPercent: decimal("pICMSEfet", { precision: 5, scale: 2 }),
  effectiveIcmsAmount: decimal("vICMSEfet", { precision: 18, scale: 3 }),

  // === Suframa ===
  suframaDiscount: float("DescSuframa"),
  complementaryDiscountFlag: int("flgDescCompl"),

  // === Delivery ===
  maxDeliveryDate: datetime("DataMaxEnt"),
  originalMaxDeliveryDate: datetime("DataMaxEntOri"),
  deliveryDays: int("QtdeDiasEntrega"),

  // === Purchase Order ===
  purchaseOrder: varchar("OrdemCompra", { length: 60 }),
  purchaseOrderItem: varchar("ItemOrdemCompra", { length: 15 }),
  orderItemNumber: int("NItemOrdem"),
  contractNumber: varchar("numcontrato", { length: 20 }),

  // === Notes / Text ===
  notes: varchar("Observacao", { length: 2000 }),
  complement: varchar("Complemento", { length: 500 }),
  analysis: varchar("Analise", { length: 255 }),
  invoiceNotes: varchar("ObservacaoNF", { length: 255 }),
  text: text("Texto"),
  priceOriginList: varchar("LPrecoOrigem", { length: 50 }),

  // === Misc ===
  weight: float("Peso"),
  handle: int("Manipular"),
}, (table) => [
  primaryKey({ columns: [table.orderId, table.itemNumber] }),
])

export type OrderItem = typeof orderItems.$inferSelect
