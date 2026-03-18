import { mssqlTable, varchar, int, datetime, bit } from "drizzle-orm/mssql-core";

export const mdfeMotoristas = mssqlTable("MDFeMotoristas", {
  id: int("ID").primaryKey().identity(),
  empresa: varchar("Empresa", { length: 2 }).notNull(),
  filial: varchar("Filial", { length: 2 }).notNull(),
  nome: varchar("Nome", { length: 300 }).notNull(),
  dataNascimento: datetime("DataNascimento"),
  rg: varchar("RG", { length: 50 }),
  orgaoEmissor: varchar("OrgaoEmissor", { length: 10 }),
  cpf: varchar("CPF", { length: 11 }).notNull(),
  categoria: varchar("Categoria", { length: 3 }).notNull(),
  nacionalidade: varchar("Nacionalidade", { length: 50 }),
  observacoes: varchar("Observacoes", { length: 100 }),
  dataPrimeiraHabilitacao: datetime("DataPrimeiraHabilitacao"),
  dataEmissao: datetime("DataEmissao"),
  dataValidade: datetime("DataValidade").notNull(),
  numeroRegistro: varchar("NumeroRegistro", { length: 15 }).notNull(),
  ativo: bit("Ativo").notNull(),
  dataHoraCadastro: datetime("DataHoraCadastro").notNull(),
  usuarioCadastro: varchar("UsuarioCadastro", { length: 10 }).notNull(),
});

export type MdfeMotorista = typeof mdfeMotoristas.$inferSelect;