import { useActuals, useDeleteActual, type Actual } from '../../hooks/useActuals';
import { Button } from '../ui/button';
import { formatCurrency, formatDate } from '../../lib/utils';

interface ActualsListProps {
  activityId: string;
  estimatedSpendUsd?: number;
  onEdit?: (actual: Actual) => void;
}

export function ActualsList({ activityId, estimatedSpendUsd = 0, onEdit }: ActualsListProps) {
  const { data: actuals = [], isLoading } = useActuals(activityId);
  const deleteMutation = useDeleteActual();

  const totalActuals = actuals.reduce((sum, actual) => sum + actual.amountUsd, 0);
  const variance = totalActuals - estimatedSpendUsd;
  const variancePercent = estimatedSpendUsd > 0 ? (variance / estimatedSpendUsd) * 100 : 0;
  const isOverBudget = variance > 0;

  const handleDelete = async (actualId: string) => {
    if (window.confirm('Are you sure you want to delete this actual entry?')) {
      try {
        await deleteMutation.mutateAsync({ actualId, activityId });
      } catch (error) {
        console.error('Failed to delete actual:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p>Loading actuals...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/40 rounded-lg p-5 transition-all hover:shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Estimated</div>
          <div className="text-2xl font-bold text-foreground font-mono tabular-nums">{formatCurrency(estimatedSpendUsd)}</div>
        </div>

        <div className="bg-card border border-border/40 rounded-lg p-5 transition-all hover:shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Actual</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">{formatCurrency(totalActuals)}</div>
        </div>

        <div className={`bg-card rounded-lg p-5 transition-all hover:shadow-sm border ${
          isOverBudget 
            ? 'border-red-500/30 bg-red-500/5' 
            : 'border-emerald-500/30 bg-emerald-500/5'
        }`}>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Variance</div>
          <div className="text-2xl font-bold text-foreground font-mono tabular-nums">
            {isOverBudget ? '+' : ''}{formatCurrency(variance)}
            <span className="text-base ml-2 text-muted-foreground">
              ({isOverBudget ? '+' : ''}{variancePercent.toFixed(1)}%)
            </span>
          </div>
          {isOverBudget && (
            <div className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">Over budget</div>
          )}
        </div>
      </div>

      {/* Actuals Table */}
      {actuals.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border/40">
          <div className="text-4xl mb-3 opacity-50">📊</div>
          <h3 className="text-base font-semibold text-foreground mb-1">No actual spend recorded</h3>
          <p className="text-muted-foreground text-sm">Record your first actual expense to start tracking spend against estimates.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/40 bg-card">
          <table className="w-full border-collapse">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground border-b border-border/40">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground border-b border-border/40">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground border-b border-border/40">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground border-b border-border/40">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground border-b border-border/40">Attachments</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground border-b border-border/40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actuals.map((actual) => (
                <tr key={actual.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 border-b border-border/40 text-sm text-muted-foreground tabular-nums font-mono">
                    {formatDate(actual.entryDate)}
                  </td>
                  <td className="px-4 py-3 border-b border-border/40">
                    <span className="inline-block px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                      {actual.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border/40 text-sm font-semibold text-foreground tabular-nums font-mono">
                    {formatCurrency(actual.amountUsd)}
                  </td>
                  <td className="px-4 py-3 border-b border-border/40 text-sm text-foreground max-w-xs truncate">
                    {actual.description || '—'}
                  </td>
                  <td className="px-4 py-3 border-b border-border/40 text-sm text-muted-foreground">
                    {actual.attachments.length > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        📎 {actual.attachments.length}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-border/40 text-right">
                    <div className="flex gap-2 justify-end">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(actual)}
                          className="h-8 text-xs"
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(actual.id)}
                        disabled={deleteMutation.isPending}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
