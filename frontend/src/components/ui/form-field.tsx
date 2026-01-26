import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  success?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField - Industrial Command Centre Form Wrapper
 *
 * Unified form field wrapper with:
 * - Required field indicators (critical-red asterisk with pulse)
 * - Error states (critical-red border, icon, message with warning triangle)
 * - Success states (success-green border, checkmark icon)
 * - Help text (muted with info icon)
 * - Label with uppercase mono typography
 * - Smooth transitions and industrial styling
 */
export function FormField({
  label,
  error,
  helpText,
  required = false,
  success = false,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label with Required Indicator */}
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-foreground"
        >
          {label}
          {required && (
            <span
              className="text-critical-red animate-pulse"
              aria-label="required field"
              title="Required field"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Input/Select/Textarea Container with Status Indicator */}
      <div className="relative">
        {children}

        {/* Success Checkmark Icon */}
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <CheckCircle2 className="h-4 w-4 text-success-green animate-in fade-in zoom-in duration-320" />
          </div>
        )}

        {/* Error Alert Icon */}
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <AlertCircle className="h-4 w-4 text-critical-red animate-in fade-in zoom-in duration-320" />
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && !hasError && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="font-mono">{helpText}</span>
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <div className="flex items-start gap-1.5 text-xs text-critical-red font-mono animate-in slide-in-from-top-1 duration-320">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
