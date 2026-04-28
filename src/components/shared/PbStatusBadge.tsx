import { cn } from "@/lib/PbShadCnLib"

interface PbStatusBadgeProps {
  active: boolean
  className?: string
}

export function PbStatusBadge({ active, className }: PbStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-green-100 text-green-700"
          : "bg-red-50 text-red-600",
        className,
      )}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  )
}
