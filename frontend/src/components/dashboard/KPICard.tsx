import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description: string;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const variantStyles = {
  default: {
    icon: "bg-primary/10 text-primary",
    border: "border-border/40 hover:border-primary/50",
    value: "text-foreground",
  },
  success: {
    icon: "bg-accent/10 text-accent",
    border: "border-accent/30 hover:border-accent/50",
    value: "text-accent",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    border: "border-warning/30 hover:border-warning/50",
    value: "text-warning",
  },
  danger: {
    icon: "bg-destructive/10 text-destructive",
    border: "border-destructive/30 hover:border-destructive/50",
    value: "text-destructive",
  },
};

export function KPICard({
  icon: Icon,
  label,
  value,
  description,
  variant = "default",
  className,
}: KPICardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-5 transition-all duration-200",
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", styles.icon)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-caption">{label}</span>
      </div>
      <div
        className={cn(
          "text-2xl font-bold mb-0.5 font-mono tracking-tight",
          styles.value
        )}
      >
        {value}
      </div>
      <div className="text-small">{description}</div>
    </div>
  );
}

interface KPICardSkeletonProps {
  className?: string;
}

export function KPICardSkeleton({ className }: KPICardSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border/40 rounded-lg p-5 animate-pulse",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 bg-muted rounded-lg" />
        <div className="w-12 h-3 bg-muted rounded" />
      </div>
      <div className="w-24 h-7 bg-muted rounded mb-1" />
      <div className="w-16 h-3 bg-muted rounded" />
    </div>
  );
}
