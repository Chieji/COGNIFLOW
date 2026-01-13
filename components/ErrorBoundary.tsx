import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorTracking } from '../services/errorTrackingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches React component errors and displays fallback UI
 * 
 * Usage:
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
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
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service (if configured)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    errorTracking.logError(error, errorInfo.componentStack);
  }


  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/10 p-8">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  An unexpected error occurred. Please try refreshing the page.
                </p>

                {this.state.error && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">
                      Error details
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-64">
                      <code className="text-red-600 dark:text-red-400">
                        {this.state.error.message}
                        {'\n\n'}
                        {this.state.error.stack}
                      </code>
                    </pre>
                  </details>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    }

    return this.props.children;
  }
}

/**
 * Global unhandled promise rejection handler
 * Call this once in your app entry point
 */
export function setupGlobalErrorHandlers(): void {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[GlobalError] Unhandled promise rejection:', event.reason);

    // Prevent default browser behavior
    event.preventDefault();

    // Log to error service
    if (event.reason instanceof Error) {
      errorTracking.logError(event.reason);
    } else {
      errorTracking.logError(new Error(String(event.reason)));
    }
  });

  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('[GlobalError] Uncaught error:', event.error);

    // Log to error service
    if (event.error instanceof Error) {
      errorTracking.logError(event.error);
    } else {
      errorTracking.logError(new Error(event.message));
    }
  });
}
