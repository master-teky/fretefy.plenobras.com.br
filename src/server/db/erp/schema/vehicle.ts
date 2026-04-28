import { mssqlTable, varchar, int, datetime, bit } from "drizzle-orm/mssql-core";

export const mdfeVehicles = mssqlTable("MDFeVeiculos", {
  id: int("ID").primaryKey().identity(),
  carrierId: int("TransportadoraID").notNull(),
  company: varchar("Empresa", { length: 2 }).notNull(),
  branch: varchar("Filial", { length: 2 }).notNull(),
  brand: varchar("Marca", { length: 100 }).notNull(),
  model: varchar("Modelo", { length: 100 }).notNull(),
  manufacturingYear: int("AnoFabricacao").notNull(),
  modelYear: int("AnoModelo").notNull(),
  registrationCode: varchar("Renavam", { length: 11 }),
  chassis: varchar("Chassis", { length: 100 }),
  color: varchar("Cor", { length: 50 }),
  plate: varchar("Placa", { length: 10 }).notNull(),
  rntrc: varchar("RNTRC", { length: 10 }),
  notes: varchar("Observacao", { length: 1000 }),
  defaultDriverId: int("MotoristaPadrao"),
  active: bit("Ativo").notNull(),
  createdAt: datetime("DataHoraCadastro").notNull(),
  createdBy: varchar("UsuarioCadastro", { length: 10 }).notNull(),
  transportUnitType: int("TipoUnidadeTransporte").notNull(),
  tareWeight: int("Tara").notNull(),
  loadCapacity: int("CapacidadeCarga").notNull(),
  bodyType: varchar("TipoCarroceria", { length: 2 }),
  wheelType: varchar("TipoRodado", { length: 2 }),
});

export type MdfeVehicle = typeof mdfeVehicles.$inferSelect;