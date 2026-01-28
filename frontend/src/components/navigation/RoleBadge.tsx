import { UserRole } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  Admin: {
    label: "Administrator",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50",
  },
  ProjectManager: {
    label: "Project Manager",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/50",
  },
  Finance: {
    label: "Finance",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50",
  },
  CommitteeMember: {
    label: "Committee",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50",
  },
  Auditor: {
    label: "Auditor",
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900/50",
  },
  Viewer: {
    label: "Viewer",
    className:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center px-3 py-1.5 rounded-lg border text-[11px] font-semibold tracking-wide w-full",
        config.className,
        className,
      )}
    >
      {config.label}
    </div>
  );
}
