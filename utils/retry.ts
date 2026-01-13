/**
 * Retry logic utility with exponential backoff
 * Use for any operation that might transiently fail
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  onRetry: () => {},
  shouldRetry: () => true,
};

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if we shouldn't
      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts - 1) {
        break;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        opts.maxDelay
      );

      opts.onRetry(attempt + 1, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Retry with specific error type handling
 */
export async function retryOnNetworkError<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  return retry(operation, {
    maxAttempts,
    shouldRetry: (error) => {
      // Retry on network errors, timeouts, and rate limits
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('429') ||
        message.includes('503')
      );
    },
    onRetry: (attempt, error) => {
      console.warn(`[Retry] Attempt ${attempt} failed:`, error.message);
    },
  });
}
