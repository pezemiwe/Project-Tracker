import { ICellRendererParams } from "ag-grid-community";
import { Lock, Eye } from "lucide-react";
import { cn } from "../../lib/utils";

// Status badge colours - consistent with design system
const STATUS_STYLES: Record<string, string> = {
  Planned:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50",
  InProgress:
    "bg-accent/10 text-accent border-accent/30 dark:bg-accent/20 dark:text-accent dark:border-accent/40",
  OnHold:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50",
  Completed:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Cancelled:
    "bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/40",
};

// Format serial number with prefix
export function SerialNumberCell(params: ICellRendererParams) {
  const value = params.value;
  if (value === null || value === undefined) return "—";
  return (
    <span className="font-mono text-sm text-primary/80">
      ACT-{value.toString().padStart(4, "0")}
    </span>
  );
}

// Title cell with lock indicator
export function TitleCell(params: ICellRendererParams) {
  const isLocked = !!params.data?.lockedBy;
  return (
    <div className="flex items-center gap-2 h-full">
      {isLocked && (
        <Lock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
      )}
      <span className="truncate text-sm font-medium">{params.value}</span>
    </div>
  );
}

// Status badge cell
export function StatusCell(params: ICellRendererParams) {
  const status = params.value as string;
  const style = STATUS_STYLES[status] || STATUS_STYLES.Planned;
  return (
    <div className="flex items-center h-full">
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
          style
        )}
      >
        {status === "InProgress" ? "In Progress" : status}
      </span>
    </div>
  );
}

// Date cell with formatting
export function DateCell(params: ICellRendererParams) {
  if (!params.value) return <span className="text-muted-foreground">—</span>;
  const formatted = new Date(params.value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return <span className="font-mono text-sm">{formatted}</span>;
}

// Currency cell
export function CurrencyCell(params: ICellRendererParams) {
  if (!params.value) return <span className="text-muted-foreground">—</span>;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(params.value);
  return <span className="font-mono text-sm font-medium">{formatted}</span>;
}

// Progress bar cell with colour coding
export function ProgressCell(params: ICellRendererParams) {
  const percent = params.value || 0;
  const getBarColour = (p: number) => {
    if (p >= 100) return "bg-accent";
    if (p >= 75) return "bg-primary";
    if (p >= 50) return "bg-blue-500";
    if (p >= 25) return "bg-amber-500";
    return "bg-slate-400";
  };
  return (
    <div className="flex items-center gap-2 h-full pr-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", getBarColour(percent))}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground font-mono w-9 text-right">
        {percent}%
      </span>
    </div>
  );
}

// Actions cell with view button
interface ActionsCellProps extends ICellRendererParams {
  onView?: (data: any) => void;
}

export function ActionsCell(params: ActionsCellProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (params.onView) {
      params.onView(params.data);
    }
  };

  return (
    <div className="flex items-center justify-center h-full gap-1">
      <button
        onClick={handleClick}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="View details"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
}

// Muted text cell for secondary information
export function MutedTextCell(params: ICellRendererParams) {
  if (!params.value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-sm text-muted-foreground truncate">{params.value}</span>
  );
}
