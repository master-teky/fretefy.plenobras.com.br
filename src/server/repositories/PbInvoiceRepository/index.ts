import { getErpDb } from "@/server/db/erp"
import { invoices, type Invoice } from "@/server/db/erp/schema/invoice"
import { eq } from "drizzle-orm"

export async function findInvoiceByNumber(invoiceNumber: number): Promise<Invoice | null> {
  const db = await getErpDb()
  const rows = await db.select().top(1).from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber))
  return rows[0] ?? null
}
