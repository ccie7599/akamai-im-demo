import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  color?: "primary" | "success" | "warning" | "error"
  className?: string
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color = "primary",
  className,
}: MetricCardProps) {
  const colorMap = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
  }

  return (
    <div
      className={cn(
        "bg-surface rounded-xl border border-border-subtle p-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className={cn("w-4 h-4", colorMap[color])} />}
      </div>
      <p className={cn("text-2xl font-bold", colorMap[color])}>{value}</p>
      {subtitle && (
        <p className="text-xs text-text-muted mt-1">{subtitle}</p>
      )}
    </div>
  )
}
