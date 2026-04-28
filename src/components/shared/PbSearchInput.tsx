"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/PbShadCnLib"

interface PbSearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  debounceMs?: number
}

export function PbSearchInput({
  placeholder = "Buscar...",
  value,
  onChange,
  className,
  debounceMs = 300,
}: PbSearchInputProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [local, debounceMs, onChange, value])

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="pl-8 min-w-[200px]"
      />
    </div>
  )
}
