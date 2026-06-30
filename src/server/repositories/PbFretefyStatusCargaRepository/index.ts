import { getDb } from "@/server/db"
import { fretefyStatusCarga, type FretefyStatusCargaInsert } from "@/server/db/schema/fretefy-status-carga"
import { eq, sql } from "drizzle-orm"

export async function findByTrackingNumber(
  trackingNumber: string,
): Promise<typeof fretefyStatusCarga.$inferSelect[]> {
  const db = await getDb()
  return db.select().from(fretefyStatusCarga).where(eq(fretefyStatusCarga.trackingNumber, trackingNumber))
}

export async function deleteByTrackingNumber(trackingNumber: string): Promise<void> {
  const db = await getDb()
  await db.delete(fretefyStatusCarga).where(eq(fretefyStatusCarga.trackingNumber, trackingNumber))
}

export async function saveFretefyStatusCarga(records: FretefyStatusCargaInsert[]): Promise<void> {
  if (records.length === 0) return

  const db = await getDb()

  const valueRows = records.map(
    (r) => sql`(${r.company}, ${r.branch}, ${r.issuerTaxId}, ${r.series}, ${r.invoiceNumber}, ${r.type}, ${r.trackingNumber})`,
  )

  await db.execute(sql`
    MERGE FretefyStatusCarga WITH (HOLDLOCK) AS target
    USING (VALUES ${sql.join(valueRows, sql`, `)})
      AS source (Empresa, Filial, Cgcemissor, Series, NumNF, Tipo, NumeroConhecimento)
    ON (
      target.Empresa = source.Empresa AND
      target.Filial = source.Filial AND
      target.Cgcemissor = source.Cgcemissor AND
      target.Series = source.Series AND
      target.NumNF = source.NumNF AND
      target.Tipo = source.Tipo
    )
    WHEN MATCHED THEN
      UPDATE SET target.NumeroConhecimento = source.NumeroConhecimento
    WHEN NOT MATCHED THEN
      INSERT (Empresa, Filial, Cgcemissor, Series, NumNF, Tipo, NumeroConhecimento)
      VALUES (source.Empresa, source.Filial, source.Cgcemissor, source.Series, source.NumNF, source.Tipo, source.NumeroConhecimento);
  `)
}