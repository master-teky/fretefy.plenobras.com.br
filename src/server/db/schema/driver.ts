import { mssqlTable, varchar, int, datetime, bit } from "drizzle-orm/mssql-core";

export const mdfeDrivers = mssqlTable("MDFeMotoristas", {
  id: int("ID").primaryKey().identity(),
  company: varchar("Empresa", { length: 2 }).notNull(),
  branch: varchar("Filial", { length: 2 }).notNull(),
  name: varchar("Nome", { length: 300 }).notNull(),
  birthDate: datetime("DataNascimento"),
  identityCard: varchar("RG", { length: 50 }),
  issuingAuthority: varchar("OrgaoEmissor", { length: 10 }),
  taxId: varchar("CPF", { length: 11 }).notNull(),
  category: varchar("Categoria", { length: 3 }).notNull(),
  nationality: varchar("Nacionalidade", { length: 50 }),
  notes: varchar("Observacoes", { length: 100 }),
  firstLicenseDate: datetime("DataPrimeiraHabilitacao"),
  issueDate: datetime("DataEmissao"),
  expirationDate: datetime("DataValidade").notNull(),
  registrationNumber: varchar("NumeroRegistro", { length: 15 }).notNull(),
  active: bit("Ativo").notNull(),
  createdAt: datetime("DataHoraCadastro").notNull(),
  createdBy: varchar("UsuarioCadastro", { length: 10 }).notNull(),
});

export type MdfeDriver = typeof mdfeDrivers.$inferSelect;