/**
 * Dialog Component
 *
 * Enhanced Radix UI Dialog wrapper with industrial command centre aesthetic.
 * Supports focus trapping, Escape/backdrop close, loading overlays.
 *
 * Last Updated: 2026-01-21
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

interface DialogOverlayProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  loading?: boolean;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, loading, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
      'data-[state=open]:animate-fade-in',
      'data-[state=closed]:animate-fade-out',
      className
    )}
    {...props}
  >
    {loading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-6 py-4 shadow-xl">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Processing
          </span>
        </div>
      </div>
    )}
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = 'DialogOverlay';

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  loading?: boolean;
  showClose?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({
  className,
  children,
  closeOnEscape = true,
  closeOnBackdrop = true,
  loading = false,
  showClose = true,
  ...props
}, ref) => (
  <DialogPortal>
    <DialogOverlay
      loading={loading}
      onClick={(e) => {
        if (!closeOnBackdrop) {
          e.preventDefault();
        }
      }}
    />
    <DialogPrimitive.Content
      ref={ref}
      onEscapeKeyDown={(e) => {
        if (!closeOnEscape) {
          e.preventDefault();
        }
      }}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 w-full max-w-3xl translate-x-[-50%] translate-y-[-50%]',
        'rounded-lg border border-border bg-card shadow-2xl',
        'max-h-[90vh] overflow-hidden',
        'data-[state=open]:animate-slide-in-up',
        'data-[state=closed]:animate-fade-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        loading && 'pointer-events-none opacity-60',
        className
      )}
      {...props}
    >
      {children}
      {showClose && !loading && (
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4 rounded-sm opacity-70',
            'transition-all duration-200',
            'hover:opacity-100 hover:bg-accent/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:pointer-events-none',
            'group'
          )}
        >
          <X className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-2 border-b border-border px-6 py-4',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-border px-6 py-4',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'font-semibold text-lg text-foreground',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      'font-mono text-sm text-muted-foreground',
      className
    )}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'overflow-y-auto px-6 py-4',
      className
    )}
    {...props}
  />
);
DialogBody.displayName = 'DialogBody';

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};
