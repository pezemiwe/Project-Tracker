import { UserRole } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<
  UserRole,
  { label: string; className: string }
> = {
  Admin: {
    label: 'ADMIN',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
  },
  ProjectManager: {
    label: 'PM',
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
  },
  Finance: {
    label: 'FIN',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
  },
  CommitteeMember: {
    label: 'COM',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
  },
  Auditor: {
    label: 'AUD',
    className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50',
  },
  Viewer: {
    label: 'VIEW',
    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </div>
  );
}
