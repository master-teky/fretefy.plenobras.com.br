"use client"

import type { ReactNode } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/PbShadCnLib"

interface PbDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

export function PbDetailSheet({ open, onOpenChange, title, children }: PbDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 gap-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-sm font-semibold text-[#003062]">{title}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-5">{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface PbDetailSectionProps {
  title: string
  children: ReactNode
  highlighted?: boolean
  className?: string
}

export function PbDetailSection({ title, children, highlighted, className }: PbDetailSectionProps) {
  if (highlighted) {
    return (
      <div className={cn("rounded-xl bg-gradient-to-br from-[#f0f7ff] to-[#e8f4fd] border border-[#d0e3f7] p-4", className)}>
        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#003062]">{title}</h4>
        {children}
      </div>
    )
  }

  return (
    <div className={className}>
      <h4 className="mb-3 border-b border-border pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  )
}

interface PbDetailFieldProps {
  label: string
  value: ReactNode
  className?: string
  danger?: boolean
  success?: boolean
}

export function PbDetailField({ label, value, className, danger, success }: PbDetailFieldProps) {
  return (
    <div className={className}>
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-[11px] font-medium text-foreground",
          danger && "font-semibold text-red-600",
          success && "font-semibold text-green-600",
        )}
      >
        {value ?? "—"}
      </div>
    </div>
  )
}
