/**
 * ErrorBoundary Component
 *
 * React error boundary for graceful error recovery with industrial command centre aesthetic.
 * Catches JavaScript errors anywhere in child component tree, logs errors, and displays fallback UI.
 *
 * Last Updated: 2026-01-21
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'page' | 'section';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Class Component
 *
 * Catches unhandled errors in React component tree.
 * Provides retry mechanism and fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console with styling
    console.group(
      '%c⚠️ ERROR BOUNDARY CAUGHT ERROR',
      'color: #ef4444; font-weight: bold; font-size: 14px;'
    );
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const { level = 'app' } = this.props;
      const isAppLevel = level === 'app';

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="rounded-lg border-4 border-critical-red/20 bg-card shadow-2xl overflow-hidden">
              {/* Header with Alert Icon */}
              <div className="bg-gradient-to-r from-critical-red/10 to-critical-red/5 border-b-2 border-critical-red/20 p-8">
                <div className="flex items-start gap-6">
                  {/* Animated Icon */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-critical-red/20 rounded-full animate-ping" />
                    <div className="relative bg-critical-red/10 rounded-full p-4 border-2 border-critical-red/30">
                      <AlertTriangle className="h-12 w-12 text-critical-red" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1 pt-2">
                    <h1 className="font-display text-4xl uppercase tracking-wider text-foreground mb-3">
                      SYSTEM ERROR
                    </h1>
                    <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                      {isAppLevel
                        ? 'A critical error has occurred in the application. The error has been logged for investigation.'
                        : 'An error occurred while rendering this component. Other parts of the application should continue to function normally.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              <div className="p-8 space-y-6">
                {/* Error Message */}
                <div className="bg-muted/50 rounded border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="font-mono text-xs uppercase tracking-wider text-warning-amber font-semibold mt-0.5">
                      Error:
                    </div>
                    <div className="flex-1 font-mono text-sm text-foreground break-words">
                      {this.state.error?.message || 'Unknown error'}
                    </div>
                  </div>
                </div>

                {/* Component Stack (collapsed by default, shown in dev) */}
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="bg-muted/30 rounded border border-border">
                    <summary className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors duration-320">
                      Component Stack (Development Only)
                    </summary>
                    <div className="px-4 pb-4 pt-2">
                      <pre className="font-mono text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  </details>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1 uppercase tracking-wider bg-command-blue hover:bg-command-blue/90"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  {isAppLevel && (
                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="flex-1 uppercase tracking-wider"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Return Home
                    </Button>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
                  <div className="h-2 w-2 rounded-full bg-critical-red animate-pulse" />
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Error State Active
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Help Text */}
            <div className="mt-6 text-center">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                If this error persists, please contact system administrator
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withErrorBoundary HOC
 *
 * Higher-order component to wrap any component with an error boundary.
 *
 * @example
 * export default withErrorBoundary(MyComponent, { level: 'page' });
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
