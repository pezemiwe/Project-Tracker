import { useState } from 'react';
import { useCreateActual, useUpdateActual, type CreateActualData, type Actual } from '../../hooks/useActuals';
import { ACTUAL_CATEGORIES } from '../../lib/constants';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface ActualFormProps {
  activityId: string;
  actual?: Actual;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ActualForm({ activityId, actual, onSuccess, onCancel }: ActualFormProps) {
  const [formData, setFormData] = useState<CreateActualData>({
    activityId,
    entryDate: actual?.entryDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    amountUsd: actual?.amountUsd || 0,
    category: actual?.category || '',
    description: actual?.description || '',
  });

  const createMutation = useCreateActual();
  const updateMutation = useUpdateActual(actual?.id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (actual) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save actual:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/40 rounded-xl p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="entryDate">Entry Date</Label>
          <Input
            id="entryDate"
            type="date"
            value={formData.entryDate}
            onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="amountUsd">Amount (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-base pointer-events-none">
              $
            </span>
            <Input
              id="amountUsd"
              type="number"
              step="0.01"
              min="0"
              value={formData.amountUsd}
              onChange={(e) => setFormData({ ...formData, amountUsd: parseFloat(e.target.value) })}
              required
              className="pl-8 font-semibold text-foreground text-base font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Select category...</option>
            {ACTUAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add notes about this expense..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : actual ? 'Update Actual' : 'Record Actual'}
        </Button>
      </div>
    </form>
  );
}
