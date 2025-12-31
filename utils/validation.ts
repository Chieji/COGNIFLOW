/**
 * Input Validation & Sanitization Utility
 * 
 * This module provides the "Security Guard" for COGNIFLOW.
 * It validates and sanitizes all user input before sending to AI APIs.
 * 
 * Purpose:
 * - Prevent API abuse (quota exhaustion via massive payloads)
 * - Prevent prompt injection attacks
 * - Ensure data integrity
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Configuration for validation constraints
 */
export const VALIDATION_CONFIG = {
  // Maximum characters allowed in a single message
  MAX_MESSAGE_LENGTH: 10000,
  
  // Maximum characters for note content
  MAX_NOTE_LENGTH: 50000,
  
  // Maximum characters for note title
  MAX_TITLE_LENGTH: 500,
  
  // Minimum characters required (prevent empty submissions)
  MIN_MESSAGE_LENGTH: 1,
  
  // List of suspicious patterns that might indicate prompt injection
  SUSPICIOUS_PATTERNS: [
    /ignore previous instructions/gi,
    /forget everything/gi,
    /system prompt/gi,
    /admin mode/gi,
    /bypass/gi,
    /jailbreak/gi,
    /override/gi,
  ],
};

/**
 * Validates a chat message before sending to AI
 * 
 * @param message - The user's input message
 * @returns ValidationResult with validity status and any errors
 * 
 * @example
 * const result = validateChatMessage("Hello, how are you?");
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export function validateChatMessage(message: string): ValidationResult {
  // Check if message exists and is a string
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      error: 'Message must be a non-empty string.',
    };
  }

  // Trim whitespace
  const trimmed = message.trim();

  // Check minimum length
  if (trimmed.length < VALIDATION_CONFIG.MIN_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: 'Message cannot be empty.',
    };
  }

  // Check maximum length
  if (trimmed.length > VALIDATION_CONFIG.MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds maximum length of ${VALIDATION_CONFIG.MAX_MESSAGE_LENGTH} characters. Current length: ${trimmed.length}.`,
    };
  }

  // Check for suspicious patterns (prompt injection indicators)
  const suspicious = VALIDATION_CONFIG.SUSPICIOUS_PATTERNS.find((pattern) =>
    pattern.test(trimmed)
  );

  if (suspicious) {
    return {
      valid: false,
      error: 'Message contains suspicious content. Please rephrase your request.',
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Validates a note title
 * 
 * @param title - The note title
 * @returns ValidationResult with validity status and any errors
 */
export function validateNoteTitle(title: string): ValidationResult {
  if (!title || typeof title !== 'string') {
    return {
      valid: false,
      error: 'Title must be a non-empty string.',
    };
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Title cannot be empty.',
    };
  }

  if (trimmed.length > VALIDATION_CONFIG.MAX_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Title exceeds maximum length of ${VALIDATION_CONFIG.MAX_TITLE_LENGTH} characters.`,
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Validates note content
 * 
 * @param content - The note content
 * @returns ValidationResult with validity status and any errors
 */
export function validateNoteContent(content: string): ValidationResult {
  if (!content || typeof content !== 'string') {
    return {
      valid: false,
      error: 'Content must be a string.',
    };
  }

  const trimmed = content.trim();

  if (trimmed.length > VALIDATION_CONFIG.MAX_NOTE_LENGTH) {
    return {
      valid: false,
      error: `Content exceeds maximum length of ${VALIDATION_CONFIG.MAX_NOTE_LENGTH} characters.`,
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Sanitizes a string by removing potentially harmful characters
 * while preserving legitimate content
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and other control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Trim excessive whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validates a batch of messages (useful for multi-turn conversations)
 * 
 * @param messages - Array of messages to validate
 * @returns Array of ValidationResults
 */
export function validateMessageBatch(messages: string[]): ValidationResult[] {
  return messages.map((message) => validateChatMessage(message));
}

/**
 * Checks if all messages in a batch are valid
 * 
 * @param messages - Array of messages to validate
 * @returns true if all messages are valid, false otherwise
 */
export function isMessageBatchValid(messages: string[]): boolean {
  const results = validateMessageBatch(messages);
  return results.every((result) => result.valid);
}

/**
 * Gets the first error from a batch of validation results
 * Useful for displaying a single error message to the user
 * 
 * @param results - Array of ValidationResults
 * @returns The first error message, or null if all are valid
 */
export function getFirstError(results: ValidationResult[]): string | null {
  const errorResult = results.find((result) => !result.valid);
  return errorResult?.error || null;
}

/**
 * Validates API payload before sending to proxy
 * This is the final checkpoint before data leaves the client
 * 
 * @param payload - The payload object to validate
 * @returns ValidationResult
 */
export function validateApiPayload(payload: {
  provider?: string;
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  [key: string]: any;
}): ValidationResult {
  // Validate messages if present
  if (payload.messages && Array.isArray(payload.messages)) {
    for (const message of payload.messages) {
      if (message.content) {
        const result = validateChatMessage(message.content);
        if (!result.valid) {
          return result;
        }
      }
    }
  }

  // Validate single prompt if present
  if (payload.prompt) {
    const result = validateChatMessage(payload.prompt);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Logs validation violations (useful for monitoring and analytics)
 * In production, this could send data to a logging service
 * 
 * @param input - The input that failed validation
 * @param reason - The reason for failure
 * @param context - Additional context (e.g., component name, user ID)
 */
export function logValidationViolation(
  input: string,
  reason: string,
  context?: Record<string, any>
): void {
  const violation = {
    timestamp: new Date().toISOString(),
    inputLength: input.length,
    reason,
    context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('[VALIDATION VIOLATION]', violation);
  }

  // TODO: In production, send to a monitoring service (Sentry, LogRocket, etc.)
  // Example: sentryClient.captureMessage(`Validation violation: ${reason}`, 'warning');
}
