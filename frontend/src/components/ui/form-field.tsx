import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

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
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-foreground"
        >
          {label}
          {required && (
            <span
              className="text-red-500 animate-pulse"
              aria-label="required field"
              title="Required field"
            >
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {children}

        {hasSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <CheckCircle2 className="h-4 w-4 text-green-600 animate-in fade-in zoom-in duration-320" />
          </div>
        )}

        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <AlertCircle className="h-4 w-4 text-red-500 animate-in fade-in zoom-in duration-320" />
          </div>
        )}
      </div>

      {helpText && !hasError && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="font-mono">{helpText}</span>
        </div>
      )}

      {hasError && (
        <div className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400 font-medium animate-in slide-in-from-top-1 duration-320">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
