import { mssqlTable, varchar, int } from "drizzle-orm/mssql-core";

// TODO: Replace with actual columns after running `npx drizzle-kit introspect`
// against the ERP database. These are placeholder columns based on expected fields.
export const mdfeVeiculos = mssqlTable("MDFeVeiculos", {
  id: int("Id").primaryKey(),
  placa: varchar("Placa", { length: 10 }).notNull(),
  rntrc: varchar("RNTRC", { length: 20 }),
  tipoVeiculo: varchar("TipoVeiculo", { length: 50 }),
  tipoCarroceria: varchar("TipoCarroceria", { length: 50 }),
});

export type MdfeVeiculo = typeof mdfeVeiculos.$inferSelect;