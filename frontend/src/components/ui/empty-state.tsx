import { LucideIcon, Inbox, Search, Lock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "no-data" | "no-results" | "no-access" | "error"
  className?: string
}

const variantConfig = {
  default: {
    icon: Inbox,
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
  "no-data": {
    icon: Inbox,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  "no-results": {
    icon: Search,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  "no-access": {
    icon: Lock,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant]
  const Icon = icon || config.icon

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "relative mb-6 rounded-full p-6 transition-all duration-200",
          config.bgColor
        )}
      >
        <Icon
          className={cn("w-12 h-12", config.iconColor)}
          strokeWidth={2}
        />
        {/* Pulse ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 animate-pulse",
            variant === "no-data" && "border-primary/30",
            variant === "no-results" && "border-amber-500/30",
            variant === "no-access" && "border-destructive/30",
            variant === "error" && "border-destructive/30",
            variant === "default" && "border-muted-foreground/20"
          )}
        />
      </div>

      {/* Content */}
      <div className="max-w-md space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
