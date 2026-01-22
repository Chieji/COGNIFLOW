/**
 * COGNIFLOW Error Boundary Component
 * 
 * Catches React component errors and displays fallback UI.
 * Integrates with global error handling middleware.
 * 
 * @version 2.0.0
 * @updated 2025-01-21
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { errorTracking } from '../services/errorTrackingService';
import { 
  CogniflowError, 
  formatErrorForUser,
  configureErrorHandler 
} from '../middleware/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorDisplay: {
    title: string;
    message: string;
    code?: string;
    retryable: boolean;
  } | null;
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
      errorDisplay: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Format error for user display
    const errorDisplay = formatErrorForUser(error);
    
    return { 
      hasError: true, 
      error,
      errorDisplay,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', {
      name: error.name,
      message: error.message,
      code: error instanceof CogniflowError ? error.code : undefined,
      componentStack: errorInfo.componentStack,
    });

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
    try {
      errorTracking.logError(error, errorInfo.componentStack ?? undefined);
    } catch (e) {
      console.error('[ErrorBoundary] Failed to log error to service:', e);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorDisplay: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { errorDisplay, error } = this.state;
      const isDev = import.meta.env?.DEV ?? false;

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
                  {errorDisplay?.title || 'Something went wrong'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {errorDisplay?.message || 'An unexpected error occurred. Please try refreshing the page.'}
                </p>

                {errorDisplay?.code && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Error code: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{errorDisplay.code}</code>
                  </p>
                )}

                {/* Show error details in development mode */}
                {isDev && error && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">
                      Developer details
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-64">
                      <code className="text-red-600 dark:text-red-400">
                        {error.name}: {error.message}
                        {error instanceof CogniflowError && error.details && (
                          <>
                            {'\n\nDetails: '}
                            {JSON.stringify(error.details, null, 2)}
                          </>
                        )}
                        {'\n\nStack trace:\n'}
                        {error.stack}
                        {this.state.errorInfo?.componentStack && (
                          <>
                            {'\n\nComponent stack:\n'}
                            {this.state.errorInfo.componentStack}
                          </>
                        )}
                      </code>
                    </pre>
                  </details>
                )}

                <div className="flex gap-3">
                  {errorDisplay?.retryable && (
                    <button
                      onClick={this.handleReset}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Go Home
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
  // Configure the error handler middleware
  configureErrorHandler({
    logErrors: true,
    showStackTrace: import.meta.env?.DEV ?? false,
    onError: (error, context) => {
      // Log to error tracking service
      try {
        errorTracking.logError(error, context);
      } catch (e) {
        console.error('[GlobalError] Failed to log to tracking service:', e);
      }
    },
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[GlobalError] Unhandled promise rejection:', {
      reason: event.reason,
      type: event.type,
    });

    // Prevent default browser behavior
    event.preventDefault();

    // Log to error service
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    errorTracking.logError(error, 'Unhandled Promise Rejection');
  });

  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('[GlobalError] Uncaught error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    // Log to error service
    const error = event.error instanceof Error 
      ? event.error 
      : new Error(event.message);
    
    errorTracking.logError(error, `${event.filename}:${event.lineno}:${event.colno}`);
  });

  // Log that global handlers are set up
  console.log('[GlobalError] Global error handlers initialized');
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}
