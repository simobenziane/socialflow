import {
  Clock,
  Sparkles,
  Eye,
  Check,
  Calendar,
  X,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

// Content status types from the API
export type ContentStatus =
  | "PENDING"
  | "NEEDS_AI"
  | "NEEDS_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "FAILED"
  | "BLOCKED"
  | "REJECTED"
  | "DELETED"

interface StatusConfig {
  color: string
  bgColor: string
  borderColor: string
  label: string
  icon: LucideIcon
  pulse: boolean
}

const STATUS_CONFIG: Record<ContentStatus, StatusConfig> = {
  PENDING: {
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500",
    borderColor: "border-slate-200 dark:border-slate-700",
    label: "Pending",
    icon: Clock,
    pulse: false,
  },
  NEEDS_AI: {
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-500",
    borderColor: "border-violet-300 dark:border-violet-700",
    label: "AI Processing",
    icon: Sparkles,
    pulse: true,
  },
  NEEDS_REVIEW: {
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-300 dark:border-amber-700",
    label: "Needs Review",
    icon: Eye,
    pulse: true,
  },
  APPROVED: {
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-500",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    label: "Approved",
    icon: Check,
    pulse: false,
  },
  SCHEDULED: {
    color: "text-sky-700 dark:text-sky-400",
    bgColor: "bg-sky-500",
    borderColor: "border-sky-300 dark:border-sky-700",
    label: "Scheduled",
    icon: Calendar,
    pulse: false,
  },
  FAILED: {
    color: "text-rose-700 dark:text-rose-400",
    bgColor: "bg-rose-500",
    borderColor: "border-rose-300 dark:border-rose-700",
    label: "Failed",
    icon: X,
    pulse: false,
  },
  BLOCKED: {
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-500",
    borderColor: "border-orange-300 dark:border-orange-700",
    label: "Blocked",
    icon: AlertTriangle,
    pulse: false,
  },
  REJECTED: {
    color: "text-rose-700 dark:text-rose-400",
    bgColor: "bg-rose-500",
    borderColor: "border-rose-300 dark:border-rose-700",
    label: "Rejected",
    icon: X,
    pulse: false,
  },
  DELETED: {
    color: "text-slate-500 dark:text-slate-500",
    bgColor: "bg-slate-400",
    borderColor: "border-slate-300 dark:border-slate-600",
    label: "Deleted",
    icon: X,
    pulse: false,
  },
}

const sizeClasses = {
  sm: {
    dot: "h-2 w-2",
    icon: "h-3 w-3",
    text: "text-xs",
    gap: "gap-1.5",
  },
  md: {
    dot: "h-2.5 w-2.5",
    icon: "h-4 w-4",
    text: "text-sm",
    gap: "gap-2",
  },
  lg: {
    dot: "h-3 w-3",
    icon: "h-5 w-5",
    text: "text-base",
    gap: "gap-2.5",
  },
}

export interface StatusIndicatorProps {
  status: ContentStatus
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  showIcon?: boolean
  className?: string
}

function StatusIndicator({
  status,
  size = "md",
  showLabel = true,
  showIcon = false,
  className,
}: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status]
  const sizes = sizeClasses[size]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center",
        sizes.gap,
        className
      )}
    >
      {showIcon ? (
        <Icon className={cn(sizes.icon, config.color)} />
      ) : (
        <span
          className={cn(
            "rounded-full",
            sizes.dot,
            config.bgColor,
            config.pulse && "animate-pulse-soft"
          )}
        />
      )}
      {showLabel && (
        <span className={cn(sizes.text, "font-medium", config.color)}>
          {config.label}
        </span>
      )}
    </span>
  )
}

// Compact dot-only version for dense UIs
function StatusDot({
  status,
  size = "md",
  className,
}: {
  status: ContentStatus
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  const sizes = sizeClasses[size]

  return (
    <span
      className={cn(
        "rounded-full inline-block",
        sizes.dot,
        config.bgColor,
        config.pulse && "animate-pulse-soft",
        className
      )}
      title={config.label}
    />
  )
}

// Export utility for getting status config
function getStatusConfig(status: ContentStatus): StatusConfig {
  return STATUS_CONFIG[status]
}

export { StatusIndicator, StatusDot, getStatusConfig, STATUS_CONFIG }
