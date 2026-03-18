import { mssqlTable, varchar, int } from "drizzle-orm/mssql-core";

// TODO: Replace with actual columns after running `npx drizzle-kit introspect`
// against the ERP database. These are placeholder columns based on expected fields.
export const mdfeMotoristas = mssqlTable("MDFeMotoristas", {
  id: int("Id").primaryKey(),
  nome: varchar("Nome", { length: 255 }).notNull(),
  documento: varchar("Documento", { length: 14 }).notNull(),
  numeroCNH: varchar("NumeroCNH", { length: 20 }),
  celular: varchar("Celular", { length: 20 }),
});

export type MdfeMotorista = typeof mdfeMotoristas.$inferSelect;