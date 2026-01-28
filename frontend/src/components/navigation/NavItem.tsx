import { Link } from "@tanstack/react-router";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  index?: number;
}

export function NavItem({ to, icon: Icon, label, collapsed }: NavItemProps) {
  return (
    <Link
      to={to}
      role="menuitem"
      aria-label={label}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200",
        "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        collapsed && "justify-center",
      )}
      activeProps={{
        "aria-current": "page" as const,
        className: cn(
          "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
          "hover:bg-blue-100 dark:hover:bg-blue-900/30",
          "hover:text-blue-800 dark:hover:text-blue-300",
        ),
      }}
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
          {!collapsed && (
            <span className="text-base font-medium truncate">{label}</span>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div
              className={cn(
                "absolute left-full ml-3 px-3 py-1.5 rounded-md",
                "bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium whitespace-nowrap",
                "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                "transition-all duration-200 pointer-events-none z-50",
                "shadow-lg",
              )}
            >
              {label}
            </div>
          )}
        </>
      )}
    </Link>
  );
}
