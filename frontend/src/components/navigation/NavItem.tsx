import { Link } from '@tanstack/react-router';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        'group flex items-center gap-3 px-3 py-2 my-1 mx-2 rounded-md transition-colors duration-200',
        'hover:bg-muted/80 text-muted-foreground hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
      activeProps={{
        'aria-current': 'page' as const,
        className: cn(
          'bg-accent text-accent-foreground',
          'font-medium shadow-sm'
        ),
      }}
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 transition-colors duration-200',
              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>

          {/* Label */}
          {!collapsed && (
            <span className="text-sm truncate">
              {label}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
