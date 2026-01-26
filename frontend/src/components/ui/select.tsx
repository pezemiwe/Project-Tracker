import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  success?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, success, children, ...props }, ref) => {
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          // Error state
          hasError &&
            'border-destructive focus-visible:ring-destructive bg-destructive/5 pr-10',
          // Success state
          hasSuccess &&
            'border-emerald-500 focus-visible:ring-emerald-500 bg-emerald-500/5 pr-10',
          className
        )}
        ref={ref}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${props.id}-error` : undefined}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
