import { cn } from "@/lib/PbShadCnLib"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("")
}

interface PbAvatarProps {
  name: string
  active?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-7 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-16 text-[22px]",
} as const

export function PbAvatar({ name, active = true, size = "md", className }: PbAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        active ? "bg-[#003062]" : "bg-[#94a3b8]",
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}
