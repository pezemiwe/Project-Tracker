import { useActivityFeed } from "../../hooks/useAudit";
import { formatDistanceToNow } from "date-fns";
import { 
  PlusCircle, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  FileEdit,
  User as UserIcon
} from "lucide-react";
import { cn } from "../../lib/utils";

const ACTION_ICONS: Record<string, any> = {
  Create: PlusCircle,
  Update: RefreshCw,
  Delete: Trash2,
  Approve: CheckCircle2,
  Reject: XCircle,
  Import: FileEdit,
};

const ACTION_COLORS: Record<string, string> = {
  Create: "text-emerald-500 bg-emerald-500/10",
  Update: "text-blue-500 bg-blue-500/10",
  Delete: "text-rose-500 bg-rose-500/10",
  Approve: "text-accent bg-accent/10",
  Reject: "text-destructive bg-destructive/10",
  Import: "text-purple-500 bg-purple-500/10",
};

export function ActivityFeed() {
  const { data: feed, isLoading } = useActivityFeed(15);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/40" />

      <div className="space-y-6">
        {feed.map((item) => {
          const Icon = ACTION_ICONS[item.action] || UserIcon;
          const colorClass = ACTION_COLORS[item.action] || "text-muted-foreground bg-muted";

          return (
            <div key={item.id} className="relative flex gap-4 group">
              <div className={cn(
                "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-card",
                colorClass
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 pt-1.5 min-w-0">
                <p className="text-sm text-foreground leading-snug">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">•</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
                    {item.objectType}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
