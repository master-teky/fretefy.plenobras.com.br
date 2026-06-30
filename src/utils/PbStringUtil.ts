export function formatAddress(
  street: string | null | undefined,
  number: string | null | undefined,
  district: string | null | undefined,
  city: string | null | undefined,
): string {
  const parts = [street, number, district, city].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "—"
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length !== 8) return value
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "")

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  return value
}