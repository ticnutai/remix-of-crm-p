/**
 * RouteErrorBoundary - Error boundary per route
 * Wraps individual routes so a crash in one page doesn't kill the entire app.
 * The user can navigate back or retry without a full page reload.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[RouteErrorBoundary]', error, errorInfo.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8" dir="rtl">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-semibold">הדף נתקל בשגיאה</h2>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || 'שגיאה לא צפויה'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
              >
                <RefreshCw className="h-4 w-4" />
                נסה שוב
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted"
              >
                <Home className="h-4 w-4" />
                דף הבית
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Helper: wraps a lazy component in RouteErrorBoundary + Suspense */
export function withErrorBoundary(LazyComponent: React.LazyExoticComponent<any>) {
  return (
    <RouteErrorBoundary>
      <LazyComponent />
    </RouteErrorBoundary>
  );
}
