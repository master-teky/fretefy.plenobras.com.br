"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--border-radius": "var(--radius)",

          "--normal-bg":      "#ffffff",
          "--normal-text":    "#111827",
          "--normal-border":  "#e5e7eb",

          "--success-bg":     "#f0fdf4",
          "--success-text":   "#111827",
          "--success-border": "#86efac",

          "--warning-bg":     "#fffbeb",
          "--warning-text":   "#111827",
          "--warning-border": "#fcd34d",

          "--error-bg":       "#fef2f2",
          "--error-text":     "#111827",
          "--error-border":   "#fca5a5",

          "--info-bg":        "#eff6ff",
          "--info-text":      "#111827",
          "--info-border":    "#93c5fd",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }