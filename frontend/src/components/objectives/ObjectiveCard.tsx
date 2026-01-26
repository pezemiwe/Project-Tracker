import { useNavigate } from '@tanstack/react-router';
import { Objective } from '../../hooks/useObjectives';
import { MapPin, Calendar, Activity } from 'lucide-react';

interface ObjectiveCardProps {
  objective: Objective;
}

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
  Completed: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
  'On Hold': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
  Cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
};

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: '/objectives/$id', params: { id: objective.id } });
  };

  const statusColor =
    statusColors[objective.status] ||
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  return (
    <button
      onClick={handleClick}
      className="group relative bg-card rounded-lg border border-border/40 hover:border-primary/50 hover:shadow-md transition-all duration-300 text-left overflow-hidden flex flex-col h-full"
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusColor}`}
        >
          {objective.status}
        </span>
      </div>

      {/* Header */}
      <div className="p-5 pb-4 flex-1">
        <div className="pr-20">
          <div className="text-xs font-mono font-medium text-muted-foreground mb-2">
            OBJ-{objective.sn.toString().padStart(4, '0')}
          </div>
          <h3 className="font-semibold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-2">
            {objective.title}
          </h3>
        </div>

        {objective.shortDescription && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {objective.shortDescription}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="px-5 pb-4 space-y-2">
        {objective.regions && objective.regions.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate" title={objective.states.join(', ')}>
              {objective.regions.join(', ')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-mono text-xs">
            {objective.overallStartYear} – {objective.overallEndYear}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {objective.activityCount || 0}{' '}
            {objective.activityCount === 1 ? 'activity' : 'activities'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 bg-muted/30 px-5 py-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">
            Estimated Spend
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-base font-semibold text-foreground">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(objective.computedEstimatedSpendUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </button>
  );
}
