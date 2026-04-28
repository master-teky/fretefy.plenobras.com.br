"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type StatusFilterValue = "all" | "active" | "inactive"

interface PbStatusFilterProps {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}

export function PbStatusFilter({ value, onChange }: PbStatusFilterProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(groupValue) => {
        const newVal = groupValue[groupValue.length - 1]
        if (newVal) onChange(newVal as StatusFilterValue)
      }}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="all">Todos</ToggleGroupItem>
      <ToggleGroupItem value="active">Ativos</ToggleGroupItem>
      <ToggleGroupItem value="inactive">Inativos</ToggleGroupItem>
    </ToggleGroup>
  )
}
