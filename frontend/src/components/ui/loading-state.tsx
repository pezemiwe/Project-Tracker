import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "progress"
  message?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingState({
  variant = "spinner",
  message = "Loading...",
  className,
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  if (variant === "spinner") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <div className="relative">
          <Loader2
            className={cn(
              "animate-spin text-primary",
              sizeClasses[size]
            )}
            strokeWidth={2.5}
          />
          {/* Outer ring */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse",
              sizeClasses[size]
            )}
          />
        </div>
        {message && (
          <p className="mt-4 text-sm text-muted-foreground font-medium">
            {message}
          </p>
        )}
      </div>
    )
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (variant === "progress") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-sweep" />
        </div>
        {message && (
          <p className="text-sm text-muted-foreground text-center font-medium">
            {message}
          </p>
        )}
      </div>
    )
  }

  return null
}
