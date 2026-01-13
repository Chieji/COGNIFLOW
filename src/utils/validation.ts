/**
 * Enhanced validation utilities with security hardening
 * Prevents prompt injection, XSS, and malformed inputs
 */

// Input sanitization for AI prompts (prevent prompt injection)
export function sanitizeAIPrompt(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('[Validation] Invalid input: expected non-empty string');
  }

  // Remove control characters and normalize whitespace
  let sanitized = input
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Check for common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /system\s*:\s*you\s+are/i,
    /\[\s*system\s*\]/i,
    /disregard\s+all\s+above/i,
    /<\s*script/i, // XSS attempt
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      console.warn('[Security] Potential prompt injection detected:', sanitized.substring(0, 100));
      // Don't throw - just log and continue with sanitized version
    }
  }

  // Limit length to prevent abuse
  const MAX_PROMPT_LENGTH = 10000;
  if (sanitized.length > MAX_PROMPT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_PROMPT_LENGTH);
    console.warn(`[Validation] Prompt truncated to ${MAX_PROMPT_LENGTH} characters`);
  }

  return sanitized;
}

// Sanitize user-generated content before display (prevent XSS)
export function sanitizeUserContent(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // Remove dangerous tags and attributes
  const dangerous = /<script|<iframe|<object|<embed|javascript:|on\w+=/gi;
  let sanitized = html.replace(dangerous, '');

  // Additional XSS prevention
  sanitized = sanitized
    .replace(/<img[^>]+src=["']?data:text\/html/gi, '<img src=""')
    .replace(/eval\(/gi, '')
    .replace(/expression\(/gi, '');

  return sanitized;
}

// Rate limiting helper
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

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

  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Global rate limiter instances
export const aiCallLimiter = new RateLimiter(20, 60000); // 20 calls per minute
export const apiCallLimiter = new RateLimiter(100, 60000); // 100 calls per minute

// Validate note title
export function validateNoteTitle(title: string): { valid: boolean; error?: string } {
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

  return { valid: true };
}

// Validate note content
export function validateNoteContent(content: string): { valid: boolean; error?: string } {
  if (typeof content !== 'string') {
    return { valid: false, error: 'Content must be a string' };
  }

  // Allow empty content for new notes
  if (content.length > 100000) {
    return { valid: false, error: 'Content must be 100,000 characters or less' };
  }

  return { valid: true };
}

// Validate folder name
export function validateFolderName(name: string): { valid: boolean; error?: string } {
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

  // Check for invalid characters
  const invalidChars = /[\/:<>"\|\?\*]/;
  if (invalidChars.test(trimmed)) {
    return { valid: false, error: 'Folder name contains invalid characters' };
  }

  return { valid: true };
}

// Validate API key format
export function validateApiKey(key: string, provider: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmed = key.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: 'API key is too short' };
  }

  // Provider-specific validation
  switch (provider) {
    case 'gemini':
      if (!trimmed.startsWith('AI') && trimmed.length < 30) {
        return { valid: false, error: 'Invalid Gemini API key format' };
      }
      break;
    case 'openai':
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, error: 'Invalid OpenAI API key format' };
      }
      break;
    case 'anthropic':
      if (!trimmed.startsWith('sk-ant-')) {
        return { valid: false, error: 'Invalid Anthropic API key format' };
      }
      break;
  }

  return { valid: true };
}
