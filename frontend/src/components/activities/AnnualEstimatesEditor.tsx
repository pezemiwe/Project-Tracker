import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface YearEstimate {
  year: string;
  amount: number;
}

interface AnnualEstimatesEditorProps {
  estimates: Record<string, number>;
  estimatedTotal: number;
  onChange: (estimates: Record<string, number>) => void;
  disabled?: boolean;
  startYear?: number;
  endYear?: number;
}

export function AnnualEstimatesEditor({
  estimates,
  estimatedTotal,
  onChange,
  disabled = false,
  startYear,
  endYear,
}: AnnualEstimatesEditorProps) {
  // Convert estimates object to array for editing
  const estimatesArray: YearEstimate[] = Object.entries(estimates).map(([year, amount]) => ({
    year,
    amount,
  }));

  // Calculate sum
  const total = estimatesArray.reduce((sum, e) => sum + (e.amount || 0), 0);
  const isValid = Math.abs(total - estimatedTotal) < 0.01;

  // Get available years (years within range not already added)
  const existingYears = new Set(Object.keys(estimates));
  const availableYears: number[] = [];
  if (startYear && endYear) {
    for (let y = startYear; y <= endYear; y++) {
      if (!existingYears.has(y.toString())) {
        availableYears.push(y);
      }
    }
  }

  const handleAddYear = () => {
    // Add first available year from objective range, or current year if no range
    const yearToAdd = availableYears[0] || new Date().getFullYear();
    const newEstimates = { ...estimates, [yearToAdd.toString()]: 0 };
    onChange(newEstimates);
  };

  const handleRemoveYear = (year: string) => {
    const newEstimates = { ...estimates };
    delete newEstimates[year];
    onChange(newEstimates);
  };

  const handleYearChange = (oldYear: string, newYear: string) => {
    if (oldYear === newYear) return;

    const newEstimates = { ...estimates };
    const amount = newEstimates[oldYear];
    delete newEstimates[oldYear];
    newEstimates[newYear] = amount;
    onChange(newEstimates);
  };

  const handleAmountChange = (year: string, amount: number) => {
    const newEstimates = { ...estimates };
    newEstimates[year] = amount;
    onChange(newEstimates);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Annual Estimates</Label>
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={handleAddYear}>
            <Plus className="h-4 w-4 mr-2" />
            Add Year
          </Button>
        )}
      </div>

      {estimatesArray.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-[120px_1fr_auto] gap-3 items-center text-sm font-medium text-muted-foreground pb-2 border-b border-border/40">
            <div>Year</div>
            <div>Amount (USD)</div>
            <div className="w-8"></div>
          </div>

          {estimatesArray.map((estimate) => (
            <div
              key={estimate.year}
              className="grid grid-cols-[120px_1fr_auto] gap-3 items-center"
            >
              <Input
                type="number"
                min="2020"
                max="2050"
                value={estimate.year}
                onChange={(e) => handleYearChange(estimate.year, e.target.value)}
                disabled={disabled}
                className="font-mono"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={estimate.amount || ''}
                onChange={(e) =>
                  handleAmountChange(estimate.year, parseFloat(e.target.value) || 0)
                }
                disabled={disabled}
                className="font-mono"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveYear(estimate.year)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-border/40 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No annual estimates defined</p>
          {!disabled && (
            <Button type="button" variant="outline" size="sm" onClick={handleAddYear}>
              <Plus className="h-4 w-4 mr-2" />
              Add Year
            </Button>
          )}
        </div>
      )}

      {/* Total and validation */}
      {estimatesArray.length > 0 && (
        <div className="pt-3 border-t border-border/40 space-y-3">
          <div className="flex items-center justify-between font-medium">
            <span>Total:</span>
            <span className="font-mono">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {isValid ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Matches estimated spend</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>
                Mismatch: ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ≠ ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
