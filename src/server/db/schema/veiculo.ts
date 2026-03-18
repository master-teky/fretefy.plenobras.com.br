import { mssqlTable, varchar, int, datetime, bit } from "drizzle-orm/mssql-core";

export const mdfeVeiculos = mssqlTable("MDFeVeiculos", {
  id: int("ID").primaryKey().identity(),
  transportadoraId: int("TransportadoraID").notNull(),
  empresa: varchar("Empresa", { length: 2 }).notNull(),
  filial: varchar("Filial", { length: 2 }).notNull(),
  marca: varchar("Marca", { length: 100 }).notNull(),
  modelo: varchar("Modelo", { length: 100 }).notNull(),
  anoFabricacao: int("AnoFabricacao").notNull(),
  anoModelo: int("AnoModelo").notNull(),
  renavam: varchar("Renavam", { length: 11 }),
  chassis: varchar("Chassis", { length: 100 }),
  cor: varchar("Cor", { length: 50 }),
  placa: varchar("Placa", { length: 10 }).notNull(),
  rntrc: varchar("RNTRC", { length: 10 }),
  observacao: varchar("Observacao", { length: 1000 }),
  motoristaPadrao: int("MotoristaPadrao"),
  ativo: bit("Ativo").notNull(),
  dataHoraCadastro: datetime("DataHoraCadastro").notNull(),
  usuarioCadastro: varchar("UsuarioCadastro", { length: 10 }).notNull(),
  tipoUnidadeTransporte: int("TipoUnidadeTransporte").notNull(),
  tara: int("Tara").notNull(),
  capacidadeCarga: int("CapacidadeCarga").notNull(),
  tipoCarroceria: varchar("TipoCarroceria", { length: 2 }),
  tipoRodado: varchar("TipoRodado", { length: 2 }),
});

export type MdfeVeiculo = typeof mdfeVeiculos.$inferSelect;