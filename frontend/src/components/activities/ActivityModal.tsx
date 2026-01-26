import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useActivity,
  useCreateActivity,
  useUpdateActivity,
} from '../../hooks/useActivities';
import {
  useActivityLockStatus,
  useLockActivity,
  useUnlockActivity,
} from '../../hooks/useActivityLock';
import { useObjectives } from '../../hooks/useObjectives';
import { useSettings } from '../../hooks/useSettings';
import { useAuthStore } from '../../stores/authStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAnnouncer } from '../../hooks/useAnnouncer';
import { toast } from '../../hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { FormField } from '../ui/form-field';
import { X, Unlock, AlertCircle, CheckCircle, FileWarning } from 'lucide-react';
import { ACTIVITY_STATUS_OPTIONS, RISK_RATING_OPTIONS, PRIORITY_OPTIONS } from '../../lib/constants';
import { AnnualEstimatesEditor } from './AnnualEstimatesEditor';
import { CommentList } from './CommentList';
import { ActualForm } from '../actuals/ActualForm';
import { ActualsList } from '../actuals/ActualsList';
import { ApprovalWidget } from '../approvals/ApprovalWidget';
import type { Actual } from '../../hooks/useActuals';
import { cn } from '../../lib/utils';

const activitySchema = z.object({
  investmentObjectiveId: z.string().min(1, 'Objective is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or less'),
  descriptionAndObjective: z.string().max(5000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['Planned', 'InProgress', 'Completed', 'OnHold', 'Cancelled'] as const).default('Planned'),
  progressPercent: z.coerce.number().min(0, 'Progress must be 0 or higher').max(100, 'Progress must be 100 or lower').default(0),
  lead: z.string().max(255).optional(),
  estimatedSpendUsdTotal: z.coerce.number().min(0).default(0),
  annualEstimates: z.record(z.string(), z.number()).default({}),
  riskRating: z.string().optional(),
  priority: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityModalProps {
  activityId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityModal({ activityId, isOpen, onClose }: ActivityModalProps) {
  const { user } = useAuthStore();
  const isEdit = !!activityId;
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  const { announce } = useAnnouncer();

  // Data hooks
  const { data: activity } = useActivity(activityId || '');
  const { data: objectives } = useObjectives({ limit: 100 });
  const { data: lockStatus } = useActivityLockStatus(activityId || '', isEdit && isOpen);
  const { data: settings } = useSettings();

  // Mutation hooks
  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity(activityId || '');
  const lockMutation = useLockActivity(activityId || '');
  const unlockMutation = useUnlockActivity(activityId || '');

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      investmentObjectiveId: '',
      title: '',
      descriptionAndObjective: '',
      startDate: '',
      endDate: '',
      status: 'Planned',
      progressPercent: 0,
      lead: '',
      estimatedSpendUsdTotal: 0,
      annualEstimates: {},
      riskRating: '',
      priority: '',
    },
  });

  const [lockError, setLockError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'actuals' | 'comments'>('details');
  const [editingActual, setEditingActual] = useState<Actual | null>(null);
  const [showActualForm, setShowActualForm] = useState(false);
  const [showApprovalWidget, setShowApprovalWidget] = useState(false);
  const [originalEstimate, setOriginalEstimate] = useState<number | null>(null);

  // Watch fields for validation
  const watchedObjectiveId = watch('investmentObjectiveId');
  const watchedEstimate = watch('estimatedSpendUsdTotal');

  // Get selected objective's year range for date validation
  const selectedObjective = useMemo(() => {
    return objectives?.objectives.find((o) => o.id === watchedObjectiveId);
  }, [objectives?.objectives, watchedObjectiveId]);

  const objectiveYearRange = useMemo(() => {
    if (!selectedObjective) return null;
    return {
      minDate: `${selectedObjective.overallStartYear}-01-01`,
      maxDate: `${selectedObjective.overallEndYear}-12-31`,
      startYear: selectedObjective.overallStartYear,
      endYear: selectedObjective.overallEndYear,
    };
  }, [selectedObjective]);

  // Populate form when editing
  useEffect(() => {
    if (activity && isOpen) {
      reset({
        investmentObjectiveId: activity.investmentObjectiveId,
        title: activity.title,
        descriptionAndObjective: activity.descriptionAndObjective || '',
        startDate: activity.startDate
          ? new Date(activity.startDate).toISOString().split('T')[0]
          : '',
        endDate: activity.endDate ? new Date(activity.endDate).toISOString().split('T')[0] : '',
        status: activity.status,
        progressPercent: activity.progressPercent,
        lead: activity.lead || '',
        estimatedSpendUsdTotal: activity.estimatedSpendUsdTotal || 0,
        annualEstimates: (activity.annualEstimates as Record<string, number>) || {},
        riskRating: activity.riskRating || '',
        priority: activity.priority || '',
      });
      if (originalEstimate === null) {
        setOriginalEstimate(activity.estimatedSpendUsdTotal || 0);
      }
    }
  }, [activity, isOpen, reset, originalEstimate]);

  // Calculate if budget change requires approval
  const approvalThresholds = useMemo(() => {
    if (!settings) return { usd: 5000, percent: 10 };
    const usdSetting = settings.find((s) => s.key === 'approvalThresholdUsd');
    const percentSetting = settings.find((s) => s.key === 'approvalThresholdPercent');
    return {
      usd: usdSetting?.value ?? 5000,
      percent: percentSetting?.value ?? 10,
    };
  }, [settings]);

  const budgetChangeRequiresApproval = useMemo(() => {
    if (!isEdit || originalEstimate === null) return false;
    const change = Math.abs(watchedEstimate - originalEstimate);
    const percentChange = originalEstimate > 0
      ? (change / originalEstimate) * 100
      : (change > 0 ? 100 : 0);
    return change >= approvalThresholds.usd || percentChange >= approvalThresholds.percent;
  }, [isEdit, originalEstimate, watchedEstimate, approvalThresholds]);

  // Acquire lock on mount (edit mode only)
  useEffect(() => {
    if (isEdit && isOpen && activityId) {
      lockMutation.mutate(undefined, {
        onError: (error: Error & { response?: { data?: { error?: string } } }) => {
          const errorMsg = error.response?.data?.error || 'Failed to acquire lock';
          setLockError(errorMsg);
          toast({
            variant: "error",
            title: "Lock Failed",
            description: errorMsg,
          });
        },
      });
    }
  }, [isEdit, isOpen, activityId]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (isEdit && activityId && lockStatus?.isLocked && lockStatus.lockedBy === user?.id) {
        unlockMutation.mutate();
      }
    };
  }, [isEdit, activityId, lockStatus, user]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const firstInput = document.getElementById('investmentObjectiveId');
        firstInput?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Announce lock status changes
  useEffect(() => {
    if (isEdit && lockStatus) {
      if (lockStatus.isLocked && lockStatus.lockedBy === user?.id) {
        announce('You have acquired edit lock for this activity', 'polite');
      } else if (lockStatus.isLocked) {
        announce(`Activity is locked by ${lockStatus.lockedByUser?.fullName}`, 'assertive');
      }
    }
  }, [lockStatus?.isLocked, lockStatus?.lockedBy, isEdit, user?.id, announce]);

  const onSubmit = async (formData: ActivityFormData) => {
    // Additional date validation against objective range
    if (objectiveYearRange) {
      if (formData.startDate && formData.startDate < objectiveYearRange.minDate) {
        toast({ variant: "error", title: "Invalid Date", description: `Start date must be in ${objectiveYearRange.startYear} or later` });
        return;
      }
      if (formData.startDate && formData.startDate > objectiveYearRange.maxDate) {
        toast({ variant: "error", title: "Invalid Date", description: `Start date must be in ${objectiveYearRange.endYear} or earlier` });
        return;
      }
      if (formData.endDate && formData.endDate < objectiveYearRange.minDate) {
        toast({ variant: "error", title: "Invalid Date", description: `End date must be in ${objectiveYearRange.startYear} or later` });
        return;
      }
      if (formData.endDate && formData.endDate > objectiveYearRange.maxDate) {
        toast({ variant: "error", title: "Invalid Date", description: `End date must be in ${objectiveYearRange.endYear} or earlier` });
        return;
      }
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      toast({ variant: "error", title: "Invalid Date", description: "End date must be after start date" });
      return;
    }

    const data = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
        announce('Activity updated successfully', 'polite');
        toast({
          variant: "success",
          title: "Activity Updated",
          description: "Changes have been saved successfully",
        });
        if (budgetChangeRequiresApproval) {
          setShowApprovalWidget(true);
          toast({
            variant: "warning",
            title: "Approval Required",
            description: "Budget change requires approval workflow",
          });
          return;
        }
      } else {
        await createMutation.mutateAsync(data);
        announce('Activity created successfully', 'polite');
        toast({
          variant: "success",
          title: "Activity Created",
          description: "New activity has been added to the system",
        });
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save activity:', error);
      announce('Failed to save activity', 'assertive');
      toast({
        variant: "error",
        title: "Save Failed",
        description: isEdit ? "Failed to update activity" : "Failed to create activity",
      });
    }
  };

  const handleClose = () => {
    if (isEdit && activityId && lockStatus?.isLocked && lockStatus.lockedBy === user?.id) {
      unlockMutation.mutate();
    }
    onClose();
  };

  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;
  const userHoldsLock = lockStatus?.lockedBy === user?.id;
  const isLockedByOther = lockStatus?.isLocked && !userHoldsLock;
  const canSave = !isEdit || userHoldsLock;

  // Lock indicator config
  let lockIndicator = null;
  if (isEdit) {
    if (userHoldsLock) {
      lockIndicator = {
        icon: CheckCircle,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        iconColor: 'text-emerald-600',
        message: 'You are editing this activity',
      };
    } else if (isLockedByOther) {
      lockIndicator = {
        icon: AlertCircle,
        color: 'bg-amber-50 border-amber-200 text-amber-900',
        iconColor: 'text-amber-600',
        message: `Locked by ${lockStatus?.lockedByUser?.fullName || 'another user'}`,
      };
    } else {
      lockIndicator = {
        icon: Unlock,
        color: 'bg-slate-100 border-slate-200 text-slate-700',
        iconColor: 'text-slate-500',
        message: 'Unlocked',
      };
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl bg-card rounded-lg shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-border"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border/40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2
            id="modal-title"
            className="font-semibold text-xl text-foreground"
          >
            {isEdit ? 'Edit Activity' : 'Create Activity'}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className={cn(
              'text-muted-foreground hover:text-foreground transition-colors duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lock Indicator */}
        {lockIndicator && (
          <div
            className={`mx-4 sm:mx-6 mt-4 px-3 sm:px-4 py-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 ${lockIndicator.color}`}
          >
            <div className="flex items-center gap-2">
              <lockIndicator.icon className={`h-5 w-5 ${lockIndicator.iconColor}`} />
              <span className="font-medium text-sm">{lockIndicator.message}</span>
            </div>
            {lockStatus?.expiresAt && userHoldsLock && (
              <span className="text-xs opacity-75 sm:ml-auto">
                Expires in{' '}
                {Math.round((new Date(lockStatus.expiresAt).getTime() - Date.now()) / 60000)} min
              </span>
            )}
          </div>
        )}

        {/* Lock Error */}
        {lockError && (
          <div className="mx-4 sm:mx-6 mt-4 px-3 sm:px-4 py-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <span className="text-sm">{lockError}</span>
          </div>
        )}

        {/* Tabs - Only show for edit mode */}
        {isEdit && (
          <div className="border-b border-border/40 px-4 sm:px-6">
            <div className="flex gap-1 overflow-x-auto scrollbar-thin">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('actuals')}
                className={`px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'actuals'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Actuals & Attachments
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`px-3 sm:px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'comments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Comments
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'details' ? (
          /* Details Form */
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <FormField
              label="Investment Objective"
              htmlFor="investmentObjectiveId"
              error={errors.investmentObjectiveId?.message}
              required
            >
              <Select
                id="investmentObjectiveId"
                {...register('investmentObjectiveId')}
                error={errors.investmentObjectiveId?.message}
                disabled={isEdit}
                aria-required="true"
                aria-invalid={!!errors.investmentObjectiveId}
              >
                <option value="">Select objective</option>
                {objectives?.objectives.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.title}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Title"
              htmlFor="title"
              error={errors.title?.message}
              required
            >
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter activity title"
                error={errors.title?.message}
                maxLength={500}
                disabled={isLockedByOther}
              />
            </FormField>

            <FormField
              label="Description and Objective"
              htmlFor="descriptionAndObjective"
            >
              <Textarea
                id="descriptionAndObjective"
                {...register('descriptionAndObjective')}
                placeholder="Describe the activity and its objectives"
                rows={4}
                disabled={isLockedByOther}
              />
            </FormField>

            {objectiveYearRange && (
              <p className="text-xs text-muted-foreground">
                Activity dates must be within {objectiveYearRange.startYear}-{objectiveYearRange.endYear}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Start Date"
                htmlFor="startDate"
                error={errors.startDate?.message}
              >
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  error={errors.startDate?.message}
                  disabled={isLockedByOther}
                  min={objectiveYearRange?.minDate}
                  max={objectiveYearRange?.maxDate}
                />
              </FormField>

              <FormField
                label="End Date"
                htmlFor="endDate"
                error={errors.endDate?.message}
              >
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  error={errors.endDate?.message}
                  disabled={isLockedByOther}
                  min={objectiveYearRange?.minDate}
                  max={objectiveYearRange?.maxDate}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Status"
                htmlFor="status"
              >
                <Select
                  id="status"
                  {...register('status')}
                  disabled={isLockedByOther}
                >
                  {ACTIVITY_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === 'InProgress' ? 'In Progress' : status === 'OnHold' ? 'On Hold' : status}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Progress (%)"
                htmlFor="progressPercent"
                error={errors.progressPercent?.message}
              >
                <Input
                  id="progressPercent"
                  type="number"
                  min="0"
                  max="100"
                  {...register('progressPercent')}
                  error={errors.progressPercent?.message}
                  disabled={isLockedByOther}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Lead"
                htmlFor="lead"
              >
                <Input
                  id="lead"
                  {...register('lead')}
                  placeholder="Activity lead"
                  maxLength={255}
                  disabled={isLockedByOther}
                />
              </FormField>

              <FormField
                label="Estimated Spend (USD)"
                htmlFor="estimatedSpendUsdTotal"
              >
                <Controller
                  name="estimatedSpendUsdTotal"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="estimatedSpendUsdTotal"
                      type="text"
                      inputMode="decimal"
                      value={field.value === 0 ? '' : field.value.toLocaleString('en-US')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '');
                        const num = parseFloat(raw) || 0;
                        field.onChange(Math.max(0, num));
                      }}
                      onFocus={(e) => {
                        if (field.value === 0) {
                          e.target.value = '';
                        } else {
                          e.target.select();
                        }
                      }}
                      placeholder="0"
                      disabled={isLockedByOther}
                    />
                  )}
                />
              </FormField>
            </div>

            {/* Annual Estimates Editor */}
            <div className="border-t border-border/40 pt-6">
              <Controller
                name="annualEstimates"
                control={control}
                render={({ field }) => (
                  <AnnualEstimatesEditor
                    estimates={field.value}
                    estimatedTotal={watchedEstimate}
                    onChange={field.onChange}
                    disabled={isLockedByOther}
                    startYear={objectiveYearRange?.startYear}
                    endYear={objectiveYearRange?.endYear}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Risk Rating"
                htmlFor="riskRating"
              >
                <Select
                  id="riskRating"
                  {...register('riskRating')}
                  disabled={isLockedByOther}
                >
                  <option value="">Select risk rating</option>
                  {RISK_RATING_OPTIONS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Priority"
                htmlFor="priority"
              >
                <Select
                  id="priority"
                  {...register('priority')}
                  disabled={isLockedByOther}
                >
                  <option value="">Select priority</option>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !canSave}
                className="w-full sm:w-auto"
              >
                {isPending
                  ? 'Saving...'
                  : isEdit
                  ? 'Update Activity'
                  : 'Create Activity'}
              </Button>
            </div>

            {isLockedByOther && (
              <p className="text-sm text-amber-500 text-center">
                This activity is locked by another user. You cannot make changes.
              </p>
            )}

            {/* Budget change approval indicator */}
            {isEdit && budgetChangeRequiresApproval && !showApprovalWidget && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  Budget change exceeds threshold. Approval will be required after saving.
                </span>
              </div>
            )}

            {/* Approval Widget - shown after save when approval needed */}
            {showApprovalWidget && activityId && (
              <div className="mt-6 border-t border-border/40 pt-6">
                <ApprovalWidget
                  activityId={activityId}
                  oldValue={originalEstimate ?? undefined}
                  newValue={watchedEstimate}
                  onApprovalComplete={() => {
                    setShowApprovalWidget(false);
                    handleClose();
                  }}
                />
              </div>
            )}
          </form>
        ) : activeTab === 'actuals' ? (
          /* Actuals Tab */
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Financial Summary */}
            <div className="bg-muted/30 border border-border/40 rounded-xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Financial Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    Estimated Spend
                  </div>
                  <div className="text-2xl font-mono font-bold text-foreground tabular-nums">
                    ${activity?.estimatedSpendUsdTotal?.toLocaleString() || '0'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    Actual Spend
                  </div>
                  <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    ${(activity as { actualSpendUsdTotal?: number })?.actualSpendUsdTotal?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Record New Actual Button */}
            {!showActualForm && !editingActual && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowActualForm(true)}
                >
                  Record New Actual
                </Button>
              </div>
            )}

            {/* Actual Form */}
            {(showActualForm || editingActual) && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {editingActual ? 'Edit Actual' : 'Record New Actual'}
                </h3>
                <ActualForm
                  activityId={activityId!}
                  actual={editingActual || undefined}
                  onSuccess={() => {
                    setShowActualForm(false);
                    setEditingActual(null);
                  }}
                  onCancel={() => {
                    setShowActualForm(false);
                    setEditingActual(null);
                  }}
                />
              </div>
            )}

            {/* Actuals List */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Recorded Actuals</h3>
              <ActualsList
                activityId={activityId!}
                estimatedSpendUsd={activity?.estimatedSpendUsdTotal || 0}
                onEdit={(actual) => {
                  setEditingActual(actual);
                  setShowActualForm(false);
                }}
              />
            </div>
          </div>
        ) : (
          /* Comments Tab */
          <div className="p-4 sm:p-6">
            <CommentList activityId={activityId!} />
          </div>
        )}
      </div>
    </div>
  );
}
