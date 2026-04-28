export { getErpDb, closeErpPool } from "./erp"
export { getAppDb, closeAppPool } from "./app"

export async function closeAllPools(): Promise<void> {
  const { closeErpPool } = await import("./erp")
  const { closeAppPool } = await import("./app")
  await Promise.all([closeErpPool(), closeAppPool()])
}
