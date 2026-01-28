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
    icon: "bg-[#1a365d] text-white shadow-lg shadow-[#1a365d]/20",
    bg: "bg-gradient-to-br from-[#1a365d]/5 via-white to-white",
    border: "border-[#1a365d]/10 hover:border-[#1a365d]/30",
    value: "text-[#1a365d]",
  },
  success: {
    icon: "bg-[#059669] text-white shadow-lg shadow-[#059669]/20",
    bg: "bg-gradient-to-br from-[#059669]/5 via-white to-white",
    border: "border-[#059669]/10 hover:border-[#059669]/30",
    value: "text-[#059669]",
  },
  warning: {
    icon: "bg-warning text-white shadow-lg shadow-warning/20",
    bg: "bg-gradient-to-br from-warning/5 via-white to-white",
    border: "border-warning/10 hover:border-warning/30",
    value: "text-warning",
  },
  danger: {
    icon: "bg-destructive text-white shadow-lg shadow-destructive/20",
    bg: "bg-gradient-to-br from-destructive/5 via-white to-white",
    border: "border-destructive/10 hover:border-destructive/30",
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
        "border rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden",
        styles.bg,
        styles.border,
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
            styles.icon,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "text-3xl font-bold mb-1 font-mono tracking-tight transition-colors",
          styles.value,
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground font-medium">
        {description}
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-current opacity-[0.02] rounded-full translate-x-8 translate-y-8" />
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
        className,
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
