/**
 * ErrorTrigger Component (Development Only)
 *
 * Component for testing error boundaries in development.
 * Provides buttons to trigger different types of errors.
 *
 * Last Updated: 2026-01-21
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, Bug } from 'lucide-react';

export function ErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Trigger render error
  if (shouldThrow) {
    throw new Error('Test render error triggered by ErrorTrigger component');
  }

  const triggerRenderError = () => {
    setShouldThrow(true);
  };

  const triggerAsyncError = () => {
    setTimeout(() => {
      throw new Error('Test async error triggered by ErrorTrigger component');
    }, 100);
  };

  const triggerPromiseRejection = () => {
    Promise.reject(new Error('Test promise rejection triggered by ErrorTrigger component'));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border-2 border-warning-amber/30 rounded-lg p-4 shadow-2xl max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <Bug className="h-4 w-4 text-warning-amber" />
        <span className="font-mono text-xs uppercase tracking-wider text-warning-amber font-semibold">
          Dev Tools
        </span>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-xs text-muted-foreground mb-3">
          Test error boundary functionality
        </p>

        <Button
          onClick={triggerRenderError}
          variant="outline"
          size="sm"
          className="w-full text-xs uppercase tracking-wider border-critical-red/30 text-critical-red hover:bg-critical-red/10"
        >
          <AlertTriangle className="h-3 w-3 mr-2" />
          Trigger Render Error
        </Button>

        <Button
          onClick={triggerAsyncError}
          variant="outline"
          size="sm"
          className="w-full text-xs uppercase tracking-wider border-warning-amber/30 text-warning-amber hover:bg-warning-amber/10"
        >
          <AlertTriangle className="h-3 w-3 mr-2" />
          Trigger Async Error
        </Button>

        <Button
          onClick={triggerPromiseRejection}
          variant="outline"
          size="sm"
          className="w-full text-xs uppercase tracking-wider border-warning-amber/30 text-warning-amber hover:bg-warning-amber/10"
        >
          <AlertTriangle className="h-3 w-3 mr-2" />
          Trigger Promise Rejection
        </Button>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground mt-3 opacity-50">
        Development only
      </p>
    </div>
  );
}
