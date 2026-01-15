/**
 * COGNIFLOW Security Middleware
 *
 * Implements OWASP best practices for:
 * - Rate limiting (IP and user-based)
 * - Input validation and sanitization
 * - Secure API key handling
 * - Request/response security headers
 *
 * Security Guidelines Followed:
 * - OWASP API Security Top 10 (2023)
 * - OWASP Cheat Sheet Series
 * - NIST Cybersecurity Framework
 */

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;          // Time window in milliseconds
  maxRequests: number;       // Maximum requests per window
  message?: string;          // Custom error message
}

/**
 * In-memory rate limit storage
 * Note: In production, use Redis or similar distributed store
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * IP-based rate limiter configuration
 * Limits: 100 requests per minute per IP
 */
export const ipRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000,           // 1 minute
  maxRequests: 100,              // 100 requests per minute
  message: 'Too many requests from this IP. Please try again later.',
};

/**
 * AI API call rate limiter
 * Limits: 20 AI calls per minute to prevent excessive costs
 */
export const aiApiRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000,           // 1 minute
  maxRequests: 20,               // 20 AI calls per minute
  message: 'AI service rate limit exceeded. Please wait before making more requests.',
};

/**
 * Authentication rate limiter
 * Limits: 5 login attempts per minute per IP
 */
export const authRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000,           // 1 minute
  maxRequests: 5,                // 5 attempts per minute
  message: 'Too many authentication attempts. Please try again later.',
};

/**
 * Get client IP address from request
 * Handles proxied requests (X-Forwarded-For, X-Real-IP)
 */
export function getClientIP(request?: { headers?: Record<string, string> }): string {
  if (!request?.headers) return 'unknown';

  // Check for forwarded IP (from proxy/load balancer)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Check for real IP from proxy
  const realIP = request.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Check if request is rate limited
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = ipRateLimiter
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  // If no existing entry or window has expired, create new entry
  if (!existing || now > existing.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if under limit
  if (existing.count < config.maxRequests) {
    existing.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetTime: existing.resetTime,
    };
  }

  // Rate limited
  const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
  return {
    allowed: false,
    remaining: 0,
    resetTime: existing.resetTime,
    retryAfter,
  };
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically (e.g., every hour)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Start periodic cleanup (every hour)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

// Known safe MIME types for uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
  'application/json',
];

// Maximum file sizes (in bytes)
const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,      // 10MB for images
  audio: 25 * 1024 * 1024,      // 25MB for audio
  video: 100 * 1024 * 1024,     // 100MB for video
  file: 5 * 1024 * 1024,        // 5MB for other files
};

/**
 * Validate and sanitize user input
 * Implements schema-based validation with type checking
 */
export function validateAndSanitizeInput(
  input: unknown,
  options: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    allowedKeys?: string[];
    fieldName: string;
  }
): { valid: boolean; sanitized?: unknown; error?: string } {
  // Check required
  if (options.required && (input === null || input === undefined)) {
    return { valid: false, error: `${options.fieldName} is required` };
  }

  // Type validation
  if (input !== null && input !== undefined) {
    const actualType = Array.isArray(input) ? 'array' : typeof input;
    if (actualType !== options.type) {
      return { valid: false, error: `${options.fieldName} must be of type ${options.type}` };
    }

    // String validation
    if (options.type === 'string') {
      const str = input as string;

      // Length validation
      if (options.minLength && str.length < options.minLength) {
        return { valid: false, error: `${options.fieldName} must be at least ${options.minLength} characters` };
      }
      if (options.maxLength && str.length > options.maxLength) {
        return { valid: false, error: `${options.fieldName} cannot exceed ${options.maxLength} characters` };
      }

      // Pattern validation
      if (options.pattern && !options.pattern.test(str)) {
        return { valid: false, error: `${options.fieldName} contains invalid characters` };
      }

      // Sanitize HTML/Script content
      const sanitized = sanitizeString(str);
      return { valid: true, sanitized };
    }

    // Number validation
    if (options.type === 'number') {
      const num = Number(input);
      if (isNaN(num)) {
        return { valid: false, error: `${options.fieldName} must be a valid number` };
      }
      if (options.min !== undefined && num < options.min) {
        return { valid: false, error: `${options.fieldName} must be at least ${options.min}` };
      }
      if (options.max !== undefined && num > options.max) {
        return { valid: false, error: `${options.fieldName} cannot exceed ${options.max}` };
      }
      return { valid: true, sanitized: num };
    }

    // Object validation
    if (options.type === 'object') {
      const obj = input as Record<string, unknown>;

      // Check for unexpected keys
      if (options.allowedKeys) {
        const extraKeys = Object.keys(obj).filter(key => !options.allowedKeys!.includes(key));
        if (extraKeys.length > 0) {
          return { valid: false, error: `Unexpected fields: ${extraKeys.join(', ')}` };
        }
      }

      // Sanitize all string values in object
      const sanitizedObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitizedObj[key] = sanitizeString(value);
        } else {
          sanitizedObj[key] = value;
        }
      }

      return { valid: true, sanitized: sanitizedObj };
    }

    // Array validation
    if (options.type === 'array') {
      const arr = input as unknown[];
      if (options.maxLength && arr.length > options.maxLength) {
        return { valid: false, error: `${options.fieldName} cannot exceed ${options.maxLength} items` };
      }
      return { valid: true, sanitized: arr };
    }
  }

  return { valid: true, sanitized: input };
}

/**
 * Sanitize string to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Encode HTML entities to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove dangerous patterns
  const dangerousPatterns = [
    /javascript:/gi,
    /data:/gi,
    /vbscript:/gi,
    /<script\b[^>]*>/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /on\w+\s*=/gi,
    /expression\s*\(/gi,
    /eval\s*\(/gi,
  ];

  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Limit length to prevent DoS
  const MAX_LENGTH = 100000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized.trim();
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: { type: string; size: number; name: string }
): { valid: boolean; error?: string } {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  // Check file size based on type
  let maxSize: number;
  if (file.type.startsWith('image/')) {
    maxSize = MAX_FILE_SIZE.image;
  } else if (file.type.startsWith('audio/')) {
    maxSize = MAX_FILE_SIZE.audio;
  } else if (file.type.startsWith('video/')) {
    maxSize = MAX_FILE_SIZE.video;
  } else {
    maxSize = MAX_FILE_SIZE.file;
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)` };
  }

  // Sanitize filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (sanitizedName !== file.name) {
    console.warn(`[Security] Filename sanitized: ${file.name} -> ${sanitizedName}`);
  }

  return { valid: true };
}

// ============================================================================
// SECURE API KEY HANDLING
// ============================================================================

/**
 * Validate API key format and strength
 */
export function validateApiKeyFormat(key: string, provider: string): {
  valid: boolean;
  error?: string;
} {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmed = key.trim();

  // Minimum length check
  if (trimmed.length < 10) {
    return { valid: false, error: 'API key is too short' };
  }

  // Maximum length to prevent DoS
  if (trimmed.length > 500) {
    return { valid: false, error: 'API key format is invalid' };
  }

  // Provider-specific validation
  switch (provider.toLowerCase()) {
    case 'gemini':
      // Gemini keys typically start with 'AI' and are Base64-like
      if (!trimmed.startsWith('AI') && !/^[A-Za-z0-9_-]+$/.test(trimmed)) {
        return { valid: false, error: 'Invalid Gemini API key format' };
      }
      break;

    case 'openai':
      // OpenAI keys start with 'sk-'
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, error: 'Invalid OpenAI API key format' };
      }
      break;

    case 'anthropic':
      // Anthropic keys start with 'sk-ant-'
      if (!trimmed.startsWith('sk-ant-')) {
        return { valid: false, error: 'Invalid Anthropic API key format' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Mask API key for logging (show only first and last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) {
    return '****';
  }
  const visibleChars = 4;
  const maskedLength = key.length - (visibleChars * 2);
  return `${key.substring(0, visibleChars)}${'*'.repeat(Math.max(maskedLength, 4))}${key.substring(key.length - visibleChars)}`;
}

/**
 * Check if running in secure environment
 */
export function isSecureEnvironment(): boolean {
  // Check if running on localhost (development)
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      console.warn('[Security] Running in development mode - API keys may be exposed');
      return false;
    }
  }

  return true;
}

/**
 * Get API key from environment with validation
 */
export function getApiKey(provider: string): string | null {
  const envKey = `VITE_${provider.toUpperCase()}_API_KEY`;
  const key = import.meta.env[envKey];

  if (!key) {
    return null;
  }

  // Validate key format
  const validation = validateApiKeyFormat(key, provider);
  if (!validation.valid) {
    console.error(`[Security] Invalid API key format for ${provider}:`, validation.error);
    return null;
  }

  // Check if we're in a secure context
  if (!isSecureEnvironment() && typeof window !== 'undefined') {
    console.warn(`[Security] API key for ${provider} is exposed in client-side code`);
  }

  return key;
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Generate Content Security Policy header
 * Follows OWASP CSP guidelines
 */
export function generateCSP(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Required for Vite HMR
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ];

  return directives.join('; ');
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(self), camera=(self)',
  'Content-Security-Policy': generateCSP(),
};

// ============================================================================
// EXPORTED CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Comprehensive request validation for API endpoints
 */
export function validateAPIRequest(
  request: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    method?: string;
    path?: string;
  },
  schema?: {
    body?: Record<string, object>;
    query?: Record<string, object>;
  }
): { valid: boolean; error?: string; sanitizedBody?: Record<string, unknown> } {
  // Validate HTTP method
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (request.method && !allowedMethods.includes(request.method)) {
    return { valid: false, error: `Invalid HTTP method: ${request.method}` };
  }

  // Validate request body if schema provided
  if (schema?.body && request.body) {
    for (const [field, rules] of Object.entries(schema.body)) {
      const value = request.body[field];
      const result = validateAndSanitizeInput(value, {
        ...rules,
        fieldName: field,
      } as any);

      if (!result.valid) {
        return { valid: false, error: result.error };
      }

      if (result.sanitized !== undefined) {
        if (!request.body) request.body = {};
        (request.body as Record<string, unknown>)[field] = result.sanitized;
      }
    }
  }

  return { valid: true, sanitizedBody: request.body };
}

/**
 * Create rate-limited action wrapper
 */
export function createRateLimitedAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  rateLimiter: RateLimitConfig = aiApiRateLimiter,
  identifier?: string
): T {
  return (async (...args: Parameters<T>) => {
    const ip = getClientIP();
    const key = identifier || ip;

    const rateLimit = checkRateLimit(key, rateLimiter);
    if (!rateLimit.allowed) {
      throw new Error(rateLimiter.message || 'Rate limit exceeded');
    }

    return action(...args);
  }) as T;
}
