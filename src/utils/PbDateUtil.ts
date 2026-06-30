type DateFormat = "date" | "datetime"

const FORMAT_OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  date:     { dateStyle: "short" },
  datetime: { dateStyle: "short", timeStyle: "short" },
}

export function formatDate(
  value: Date | string | null | undefined,
  format: DateFormat = "datetime",
): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  return d.toLocaleString("pt-BR", FORMAT_OPTIONS[format])
}