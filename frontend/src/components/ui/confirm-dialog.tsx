/**
 * ConfirmDialog Component
 *
 * Confirmation dialog for destructive/warning/info actions.
 * Industrial command centre aesthetic with variant-specific styling.
 *
 * Last Updated: 2026-01-21
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}

const variantConfig: Record<
  ConfirmDialogVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconClassName: string;
    borderClassName: string;
    buttonVariant: 'destructive' | 'default';
  }
> = {
  danger: {
    icon: AlertTriangle,
    iconClassName: 'text-destructive',
    borderClassName: 'border-destructive/20',
    buttonVariant: 'destructive',
  },
  warning: {
    icon: AlertCircle,
    iconClassName: 'text-amber-500',
    borderClassName: 'border-amber-500/20',
    buttonVariant: 'default',
  },
  info: {
    icon: Info,
    iconClassName: 'text-primary',
    borderClassName: 'border-primary/20',
    buttonVariant: 'default',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  closeOnEscape = true,
  closeOnBackdrop = true,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('ConfirmDialog action failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        closeOnEscape={closeOnEscape && !loading}
        closeOnBackdrop={closeOnBackdrop && !loading}
        loading={loading}
      >
        <DialogHeader className={cn('border-l-4', config.borderClassName)}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Icon
                className={cn(
                  'h-6 w-6',
                  config.iconClassName,
                  loading && 'opacity-50'
                )}
              />
            </div>
            <div className="flex-1 space-y-2">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="min-w-[100px]"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={loading}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * useConfirmDialog Hook
 *
 * Simplified hook for managing confirm dialog state.
 *
 * @example
 * const { confirmDialog, confirm } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete User',
 *     description: 'This action cannot be undone.',
 *   });
 *   if (confirmed) {
 *     // proceed with deletion
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     {confirmDialog}
 *   </>
 * );
 */
export function useConfirmDialog() {
  const [config, setConfig] = React.useState<
    (Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm'> & {
      onConfirm?: () => void | Promise<void>;
    }) | null
  >(null);
  const [loading, setLoading] = React.useState(false);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback(
    (
      options: Omit<
        ConfirmDialogProps,
        'open' | 'onOpenChange' | 'onConfirm' | 'loading'
      >
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setConfig(options);
      });
    },
    []
  );

  const handleClose = React.useCallback(() => {
    setConfig(null);
    setLoading(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (config?.onConfirm) {
      try {
        setLoading(true);
        await config.onConfirm();
        setLoading(false);
      } catch (error) {
        setLoading(false);
        throw error;
      }
    }

    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setConfig(null);
    setLoading(false);
  }, [config]);

  const confirmDialog = config ? (
    <ConfirmDialog
      {...config}
      open={true}
      onOpenChange={handleClose}
      onConfirm={handleConfirm}
      loading={loading}
    />
  ) : null;

  return {
    confirm,
    confirmDialog,
    isOpen: config !== null,
  };
}
