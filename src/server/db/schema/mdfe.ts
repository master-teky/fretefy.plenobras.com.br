import { mssqlTable, varchar, int, datetime } from "drizzle-orm/mssql-core"

export const mdfe = mssqlTable("MDFe", {
  id: int("ID").primaryKey().identity(),
  company: varchar("Empresa", { length: 2 }).notNull(),
  branch: varchar("Filial", { length: 2 }).notNull(),
  number: int("Numero").notNull(),
  createdAt: datetime("DataCriacao").notNull(),
  createdBy: varchar("UsuarioCriacao", { length: 10 }).notNull(),
  accessKey: varchar("ChaveAcesso", { length: 48 }),
  statusId: int("Status").notNull(),
  originState: varchar("UFSaida", { length: 2 }).notNull(),
  destState: varchar("UFDestino", { length: 2 }).notNull(),
  carrierType: int("TipoTransportador").notNull(),
  modality: int("Modalidade").notNull(),
  driverId: int("MotoristaID").notNull(),
  scheduledStartAt: datetime("DataPrevisaoInicio").notNull(),
  fiscalNotes: varchar("ObservacaoFisco", { length: 2000 }),
  additionalInfo: varchar("InfoAdicional", { length: 5000 }),
  danfeName: varchar("NomeDanfe", { length: 100 }),
  approvedAt: datetime("DataAprovacao"),
  cancelReason: varchar("JustificativaCancel", { length: 255 }),
  closedAt: datetime("DataEncerramento"),
  closingMunicipalityCode: int("CodigoMunicEncerramento"),
  externalCode: varchar("CodigoExterno", { length: 50 }),
  cancelledAt: datetime("DataHoraCancelamento"),
})

export type Mdfe = typeof mdfe.$inferSelect