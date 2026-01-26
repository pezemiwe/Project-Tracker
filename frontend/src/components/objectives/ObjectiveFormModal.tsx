import { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateObjective, useUpdateObjective, Objective } from '../../hooks/useObjectives';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { MultiSelect } from '../ui/multi-select';
import { NIGERIAN_STATES, OBJECTIVE_STATUS_OPTIONS, getRegionsFromStates } from '../../lib/constants';
import { X } from 'lucide-react';

const currentYear = new Date().getFullYear();

const objectiveSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  shortDescription: z.string().max(1000, 'Short description must be 1000 characters or less').optional(),
  longDescription: z.string().max(5000, 'Long description must be 5000 characters or less').optional(),
  states: z.array(z.string()).default([]),
  tags: z.string().optional(),
  overallStartYear: z.coerce
    .number()
    .min(2020, 'Start year must be 2020 or later')
    .max(2050, 'Start year must be 2050 or earlier'),
  overallEndYear: z.coerce
    .number()
    .min(2020, 'End year must be 2020 or later')
    .max(2050, 'End year must be 2050 or earlier'),
  status: z.string().default('Active'),
}).refine((data) => data.overallEndYear >= data.overallStartYear, {
  message: 'End year must be greater than or equal to start year',
  path: ['overallEndYear'],
});

type ObjectiveFormData = z.infer<typeof objectiveSchema>;

interface ObjectiveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  objective?: Objective;
}

export function ObjectiveFormModal({ isOpen, onClose, objective }: ObjectiveFormModalProps) {
  const isEdit = !!objective;
  const createMutation = useCreateObjective();
  const updateMutation = useUpdateObjective(objective?.id || '');

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: {
      title: objective?.title || '',
      shortDescription: objective?.shortDescription || '',
      longDescription: objective?.longDescription || '',
      states: objective?.states || [],
      tags: objective?.tags.join(', ') || '',
      overallStartYear: objective?.overallStartYear || currentYear,
      overallEndYear: objective?.overallEndYear || currentYear + 1,
      status: objective?.status || 'Active',
    },
  });

  // Reset form when objective changes
  useEffect(() => {
    if (isOpen) {
      reset({
        title: objective?.title || '',
        shortDescription: objective?.shortDescription || '',
        longDescription: objective?.longDescription || '',
        states: objective?.states || [],
        tags: objective?.tags.join(', ') || '',
        overallStartYear: objective?.overallStartYear || currentYear,
        overallEndYear: objective?.overallEndYear || currentYear + 1,
        status: objective?.status || 'Active',
      });
    }
  }, [isOpen, objective, reset]);

  // Compute regions from selected states
  const selectedStates = watch('states');
  const selectedRegions = useMemo(
    () => getRegionsFromStates(selectedStates || []),
    [selectedStates]
  );

  const onSubmit = async (formData: ObjectiveFormData) => {
    const data = {
      title: formData.title,
      shortDescription: formData.shortDescription || '',
      longDescription: formData.longDescription || '',
      states: formData.states || [],
      tags: (formData.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      overallStartYear: formData.overallStartYear,
      overallEndYear: formData.overallEndYear,
      status: formData.status,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save objective:', error);
    }
  };

  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            {isEdit ? 'Edit Objective' : 'Create Investment Objective'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter objective title"
              error={errors.title?.message}
              maxLength={500}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              {...register('shortDescription')}
              placeholder="Brief summary of the objective"
              rows={2}
            />
            {errors.shortDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="longDescription">Long Description</Label>
            <Textarea
              id="longDescription"
              {...register('longDescription')}
              placeholder="Detailed description of the objective"
              rows={4}
            />
            {errors.longDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.longDescription.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="states">States (Nigerian)</Label>
            <Controller
              name="states"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={NIGERIAN_STATES.map((state) => ({ value: state, label: state }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select states..."
                />
              )}
            />
            {selectedRegions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-sm text-slate-500">Regions:</span>
                {selectedRegions.map((region) => (
                  <span
                    key={region}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-medium"
                  >
                    {region}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              {...register('status')}
            >
              {OBJECTIVE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="overallStartYear">
                Start Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="overallStartYear"
                type="number"
                {...register('overallStartYear')}
                min={2020}
                max={2050}
                error={errors.overallStartYear?.message}
              />
              {errors.overallStartYear && (
                <p className="mt-1 text-sm text-red-600">{errors.overallStartYear.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="overallEndYear">
                End Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="overallEndYear"
                type="number"
                {...register('overallEndYear')}
                min={2020}
                max={2050}
                error={errors.overallEndYear?.message}
              />
              {errors.overallEndYear && (
                <p className="mt-1 text-sm text-red-600">{errors.overallEndYear.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="Enter tags separated by commas"
            />
            <p className="mt-1 text-xs text-slate-500">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isPending ? 'Saving...' : isEdit ? 'Update Objective' : 'Create Objective'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
