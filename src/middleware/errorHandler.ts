/**
 * COGNIFLOW Global Error Handling Middleware
 * 
 * Provides robust error handling for:
 * - Async function errors
 * - Unhandled promise rejections
 * - API request failures
 * - Rate limit errors
 * - Validation errors
 * 
 * Features:
 * - Centralized error logging
 * - User-friendly error messages
 * - Error categorization
 * - Retry logic for transient failures
 * 
 * @version 1.0.0
 * @updated 2025-01-21
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Base error class for COGNIFLOW errors
 */
export class CogniflowError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CogniflowError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Validation error for invalid inputs
 */
export class ValidationError extends CogniflowError {
  public readonly field?: string;

  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends CogniflowError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends CogniflowError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends CogniflowError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends CogniflowError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404, true);
    this.name = 'NotFoundError';
  }
}

/**
 * API error for external service failures
 */
export class APIError extends CogniflowError {
  public readonly provider?: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    provider?: string,
    statusCode: number = 502,
    originalError?: Error
  ) {
    super(message, 'API_ERROR', statusCode, true, { provider });
    this.name = 'APIError';
    this.provider = provider;
    this.originalError = originalError;
  }
}

/**
 * Network error for connectivity issues
 */
export class NetworkError extends CogniflowError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 503, true);
    this.name = 'NetworkError';
  }
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Error handler configuration
 */
interface ErrorHandlerConfig {
  logErrors: boolean;
  showStackTrace: boolean;
  onError?: (error: Error, context?: string) => void;
}

const defaultConfig: ErrorHandlerConfig = {
  logErrors: true,
  showStackTrace: import.meta.env?.DEV ?? false,
  onError: undefined,
};

let config: ErrorHandlerConfig = { ...defaultConfig };

/**
 * Configure the error handler
 */
export function configureErrorHandler(options: Partial<ErrorHandlerConfig>): void {
  config = { ...config, ...options };
}

/**
 * Log error with context
 */
function logError(error: Error, context?: string): void {
  if (!config.logErrors) return;

  const errorInfo = {
    name: error.name,
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    ...(error instanceof CogniflowError && {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    }),
    ...(config.showStackTrace && { stack: error.stack }),
  };

  console.error('[ErrorHandler]', JSON.stringify(errorInfo, null, 2));

  // Call custom error handler if configured
  config.onError?.(error, context);
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: Error): {
  title: string;
  message: string;
  code?: string;
  retryable: boolean;
} {
  if (error instanceof ValidationError) {
    return {
      title: 'Invalid Input',
      message: error.message,
      code: error.code,
      retryable: false,
    };
  }

  if (error instanceof RateLimitError) {
    return {
      title: 'Too Many Requests',
      message: `Please wait ${error.retryAfter} seconds before trying again.`,
      code: error.code,
      retryable: true,
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      title: 'Authentication Required',
      message: 'Please sign in to continue.',
      code: error.code,
      retryable: false,
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      title: 'Access Denied',
      message: 'You do not have permission to perform this action.',
      code: error.code,
      retryable: false,
    };
  }

  if (error instanceof NotFoundError) {
    return {
      title: 'Not Found',
      message: error.message,
      code: error.code,
      retryable: false,
    };
  }

  if (error instanceof APIError) {
    return {
      title: 'Service Error',
      message: error.provider 
        ? `The ${error.provider} service is temporarily unavailable.`
        : 'An external service is temporarily unavailable.',
      code: error.code,
      retryable: true,
    };
  }

  if (error instanceof NetworkError) {
    return {
      title: 'Connection Error',
      message: 'Please check your internet connection and try again.',
      code: error.code,
      retryable: true,
    };
  }

  // Generic error
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    retryable: true,
  };
}

// ============================================================================
// ASYNC ERROR WRAPPER
// ============================================================================

/**
 * Wrap async functions with error handling
 * Catches errors and provides consistent error handling
 * 
 * @param fn - Async function to wrap
 * @param context - Context string for error logging
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log the error
      logError(error instanceof Error ? error : new Error(String(error)), context);

      // Re-throw CogniflowErrors as-is
      if (error instanceof CogniflowError) {
        throw error;
      }

      // Convert fetch errors to NetworkError
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Failed to connect to the server');
      }

      // Convert other errors to CogniflowError
      throw new CogniflowError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        'INTERNAL_ERROR',
        500,
        false
      );
    }
  }) as T;
}

/**
 * Try-catch wrapper that returns a result object
 * Useful for handling errors without throwing
 * 
 * @param fn - Async function to execute
 * @param context - Context string for error logging
 * @returns Result object with data or error
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ success: true; data: T } | { success: false; error: Error }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError(err, context);
    return { success: false, error: err };
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['NETWORK_ERROR', 'API_ERROR', 'RATE_LIMIT_EXCEEDED'],
};

/**
 * Execute function with retry logic
 * Implements exponential backoff for transient failures
 * 
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @param context - Context string for error logging
 * @returns Function result or throws after max attempts
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: Partial<RetryConfig> = {},
  context?: string
): Promise<T> {
  const cfg = { ...defaultRetryConfig, ...retryConfig };
  let lastError: Error | undefined;
  let delay = cfg.initialDelayMs;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const errorCode = error instanceof CogniflowError ? error.code : 'UNKNOWN_ERROR';
      const isRetryable = cfg.retryableErrors?.includes(errorCode) ?? false;

      // Handle rate limit errors specially
      if (error instanceof RateLimitError) {
        delay = error.retryAfter * 1000;
      }

      // Don't retry if not retryable or last attempt
      if (!isRetryable || attempt === cfg.maxAttempts) {
        logError(lastError, `${context} (attempt ${attempt}/${cfg.maxAttempts}, giving up)`);
        throw lastError;
      }

      // Log retry attempt
      console.warn(
        `[Retry] ${context || 'Operation'} failed (attempt ${attempt}/${cfg.maxAttempts}), ` +
        `retrying in ${delay}ms...`
      );

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * cfg.backoffMultiplier, cfg.maxDelayMs);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Retry failed');
}

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

/**
 * Setup global error handlers for unhandled errors
 * Call this once at application startup
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      logError(error, 'Unhandled Promise Rejection');
      
      // Prevent default browser handling
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      logError(event.error || new Error(event.message), 'Uncaught Error');
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type ErrorHandlerConfig,
  type RetryConfig,
};
