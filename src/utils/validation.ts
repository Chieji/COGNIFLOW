/**
 * COGNIFLOW Input Validation Utilities
 * 
 * Enhanced validation with security hardening:
 * - Prompt injection prevention
 * - XSS sanitization
 * - Rate limiting helpers
 * - Schema-based validation
 * 
 * @version 2.0.0
 * @updated 2025-01-21
 */

// ============================================================================
// AI PROMPT SANITIZATION
// ============================================================================

/**
 * Common prompt injection patterns to detect and neutralize
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)/gi,
  /forget\s+(everything|all)\s+(above|before)/gi,
  /system\s*:\s*you\s+are/gi,
  /\[\s*system\s*\]/gi,
  /\[\s*INST\s*\]/gi,
  /<\|system\|>/gi,
  /<\|assistant\|>/gi,
  /```system/gi,
  /act\s+as\s+(if\s+)?(you\s+)?(are|were)\s+a/gi,
  /pretend\s+(you\s+)?(are|to\s+be)/gi,
  /roleplay\s+as/gi,
  /you\s+are\s+now\s+(a|an|the)/gi,
  /new\s+instructions?\s*:/gi,
  /override\s+(previous\s+)?instructions?/gi,
];

/**
 * Sanitize AI prompts to prevent prompt injection attacks
 * Implements defense in depth with multiple sanitization layers
 * 
 * @param input - Raw user input for AI prompt
 * @returns Sanitized prompt string
 * @throws Error if input is invalid
 */
export function sanitizeAIPrompt(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('[Validation] Invalid input: expected non-empty string');
  }

  let sanitized = input;

  // Remove null bytes and control characters
  sanitized = sanitized
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // Normalize whitespace (but preserve intentional newlines)
  sanitized = sanitized
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  // Detect and log potential injection attempts
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('[Security] Potential prompt injection detected:', {
        pattern: pattern.toString(),
        snippet: sanitized.substring(0, 100),
      });
      // Neutralize the pattern by adding spaces
      sanitized = sanitized.replace(pattern, (match) => match.split('').join(' '));
    }
  }

  // Remove potential XSS vectors
  sanitized = sanitized
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Limit length to prevent abuse (10KB max for prompts)
  const MAX_PROMPT_LENGTH = 10000;
  if (sanitized.length > MAX_PROMPT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_PROMPT_LENGTH);
    console.warn(`[Validation] Prompt truncated to ${MAX_PROMPT_LENGTH} characters`);
  }

  return sanitized.trim();
}

// ============================================================================
// USER CONTENT SANITIZATION
// ============================================================================

/**
 * Dangerous HTML patterns to remove
 */
const DANGEROUS_HTML_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object\b[^>]*>[\s\S]*?<\/object>/gi,
  /<embed\b[^>]*>[\s\S]*?<\/embed>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<base\b[^>]*>/gi,
  /<form\b[^>]*>[\s\S]*?<\/form>/gi,
];

/**
 * Sanitize user-generated content before display
 * Prevents XSS attacks while preserving safe formatting
 * 
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeUserContent(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let sanitized = html;

  // Remove dangerous tags
  for (const pattern of DANGEROUS_HTML_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'src=""');
  sanitized = sanitized.replace(/src\s*=\s*["']?\s*data:text\/html[^"'>]*/gi, 'src=""');

  // Remove CSS expressions and behaviors
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');
  sanitized = sanitized.replace(/behavior\s*:\s*url\s*\([^)]*\)/gi, '');

  // Remove eval and similar
  sanitized = sanitized.replace(/eval\s*\(/gi, '');
  sanitized = sanitized.replace(/Function\s*\(/gi, '');

  return sanitized;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Simple rate limiter for client-side use
 * For server-side, use the middleware/security.ts implementation
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed under the rate limit
   * 
   * @param key - Identifier for the rate limit bucket
   * @returns True if allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove timestamps outside the time window
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      console.warn(`[RateLimit] Rate limit exceeded for key: ${key}`);
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  /**
   * Get remaining requests in current window
   * 
   * @param key - Identifier for the rate limit bucket
   * @returns Number of remaining requests
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  /**
   * Reset rate limit for a key
   * 
   * @param key - Identifier to reset
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }
}

// Global rate limiter instances
export const aiCallLimiter = new RateLimiter(20, 60000);    // 20 AI calls per minute
export const apiCallLimiter = new RateLimiter(100, 60000);  // 100 API calls per minute
export const searchLimiter = new RateLimiter(30, 10000);    // 30 searches per 10 seconds

// ============================================================================
// INPUT VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validate note title
 * 
 * @param title - Note title to validate
 * @returns Validation result
 */
export function validateNoteTitle(title: string): ValidationResult {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Title is required' };
  }

  const trimmed = title.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Title must be 200 characters or less' };
  }

  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return { valid: false, error: 'Title contains invalid characters' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate note content
 * 
 * @param content - Note content to validate
 * @returns Validation result
 */
export function validateNoteContent(content: string): ValidationResult {
  if (typeof content !== 'string') {
    return { valid: false, error: 'Content must be a string' };
  }

  // Allow empty content for new notes
  if (content.length > 100000) {
    return { valid: false, error: 'Content must be 100,000 characters or less' };
  }

  return { valid: true, sanitized: content };
}

/**
 * Validate folder name
 * 
 * @param name - Folder name to validate
 * @returns Validation result
 */
export function validateFolderName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Folder name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Folder name cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Folder name must be 100 characters or less' };
  }

  // Check for invalid filesystem characters
  const invalidChars = /[\/\\:<>"|\?\*\x00-\x1F]/;
  if (invalidChars.test(trimmed)) {
    return { valid: false, error: 'Folder name contains invalid characters' };
  }

  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                         'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                         'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(trimmed.toUpperCase())) {
    return { valid: false, error: 'Folder name is reserved' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate tag name
 * 
 * @param tag - Tag name to validate
 * @returns Validation result
 */
export function validateTagName(tag: string): ValidationResult {
  if (!tag || typeof tag !== 'string') {
    return { valid: false, error: 'Tag is required' };
  }

  const trimmed = tag.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Tag cannot be empty' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Tag must be 50 characters or less' };
  }

  // Only allow alphanumeric, hyphens, and underscores
  if (!/^[a-z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Tag can only contain letters, numbers, hyphens, and underscores' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate API key format
 * 
 * @param key - API key to validate
 * @param provider - AI provider name
 * @returns Validation result
 */
export function validateApiKey(key: string, provider: string): ValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmed = key.trim();
  
  if (trimmed.length < 10) {
    return { valid: false, error: 'API key is too short' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'API key is too long' };
  }

  // Provider-specific validation
  const providerLower = provider.toLowerCase();
  switch (providerLower) {
    case 'gemini':
    case 'google':
      if (!/^[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
        return { valid: false, error: 'Invalid Gemini API key format' };
      }
      break;
      
    case 'openai':
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, error: 'Invalid OpenAI API key format (should start with sk-)' };
      }
      break;
      
    case 'anthropic':
    case 'claude':
      if (!trimmed.startsWith('sk-ant-')) {
        return { valid: false, error: 'Invalid Anthropic API key format (should start with sk-ant-)' };
      }
      break;
      
    case 'openrouter':
      if (!trimmed.startsWith('sk-or-')) {
        return { valid: false, error: 'Invalid OpenRouter API key format' };
      }
      break;
      
    case 'groq':
      if (!trimmed.startsWith('gsk_')) {
        return { valid: false, error: 'Invalid Groq API key format' };
      }
      break;
      
    case 'huggingface':
      if (!trimmed.startsWith('hf_')) {
        return { valid: false, error: 'Invalid HuggingFace API key format' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Validate search query
 * 
 * @param query - Search query to validate
 * @returns Validation result
 */
export function validateSearchQuery(query: string): ValidationResult {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Search query is required' };
  }

  const trimmed = query.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Search query cannot be empty' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Search query is too long' };
  }

  // Remove potential injection characters
  const sanitized = trimmed
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '');

  return { valid: true, sanitized };
}

/**
 * Validate URL
 * 
 * @param url - URL to validate
 * @returns Validation result
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  // Check length
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }

  // Validate URL format
  try {
    const parsed = new URL(trimmed);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    return { valid: true, sanitized: trimmed };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate email address
 * 
 * @param email - Email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true, sanitized: trimmed };
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

/**
 * Field schema definition
 */
interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: (string | number | boolean)[];
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
}

/**
 * Validate data against a schema
 * 
 * @param data - Data to validate
 * @param schema - Schema definition
 * @param fieldName - Field name for error messages
 * @returns Validation result
 */
export function validateSchema(
  data: unknown,
  schema: FieldSchema,
  fieldName: string = 'value'
): ValidationResult {
  // Check required
  if (data === undefined || data === null) {
    if (schema.required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  }

  // Type validation
  const actualType = Array.isArray(data) ? 'array' : typeof data;
  if (actualType !== schema.type) {
    return { valid: false, error: `${fieldName} must be of type ${schema.type}` };
  }

  // String validation
  if (schema.type === 'string' && typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      return { valid: false, error: `${fieldName} must be at least ${schema.minLength} characters` };
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      return { valid: false, error: `${fieldName} must be at most ${schema.maxLength} characters` };
    }
    if (schema.pattern && !schema.pattern.test(data)) {
      return { valid: false, error: `${fieldName} format is invalid` };
    }
    if (schema.enum && !schema.enum.includes(data)) {
      return { valid: false, error: `${fieldName} must be one of: ${schema.enum.join(', ')}` };
    }
  }

  // Number validation
  if (schema.type === 'number' && typeof data === 'number') {
    if (schema.min !== undefined && data < schema.min) {
      return { valid: false, error: `${fieldName} must be at least ${schema.min}` };
    }
    if (schema.max !== undefined && data > schema.max) {
      return { valid: false, error: `${fieldName} must be at most ${schema.max}` };
    }
    if (schema.enum && !schema.enum.includes(data)) {
      return { valid: false, error: `${fieldName} must be one of: ${schema.enum.join(', ')}` };
    }
  }

  // Array validation
  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      return { valid: false, error: `${fieldName} must have at least ${schema.minLength} items` };
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      return { valid: false, error: `${fieldName} must have at most ${schema.maxLength} items` };
    }
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const itemResult = validateSchema(data[i], schema.items, `${fieldName}[${i}]`);
        if (!itemResult.valid) {
          return itemResult;
        }
      }
    }
  }

  // Object validation
  if (schema.type === 'object' && typeof data === 'object' && !Array.isArray(data)) {
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const propResult = validateSchema((data as Record<string, unknown>)[key], propSchema, `${fieldName}.${key}`);
        if (!propResult.valid) {
          return propResult;
        }
      }
    }
  }

  return { valid: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// ADDITIONAL VALIDATION FUNCTIONS FOR SERVICES
// ============================================================================

/**
 * Validate chat message
 * 
 * @param message - Chat message to validate
 * @returns Validation result
 */
export function validateChatMessage(message: string): ValidationResult {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 50000) {
    return { valid: false, error: 'Message is too long (max 50,000 characters)' };
  }

  // Sanitize the message
  const sanitized = sanitizeAIPrompt(trimmed);

  return { valid: true, sanitized };
}

/**
 * Validate API payload structure
 * 
 * @param payload - API payload to validate
 * @returns Validation result
 */
export function validateApiPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be an object' };
  }

  // Check payload size
  const payloadStr = JSON.stringify(payload);
  if (payloadStr.length > 1000000) { // 1MB limit
    return { valid: false, error: 'Payload too large (max 1MB)' };
  }

  return { valid: true };
}

/**
 * Log validation violations for security monitoring
 * 
 * @param input - The input that failed validation
 * @param error - The validation error
 * @param context - Additional context
 */
export function logValidationViolation(
  input: string,
  error: string,
  context?: Record<string, unknown>
): void {
  console.warn('[Validation] Violation detected:', {
    error,
    inputSnippet: input.substring(0, 100),
    context,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  RateLimiter,
  type ValidationResult,
  type FieldSchema,
};
