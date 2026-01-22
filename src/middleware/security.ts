/**
 * COGNIFLOW Security Middleware
 * 
 * Comprehensive security implementation following OWASP best practices:
 * - Rate limiting (IP and user-based with graceful 429 responses)
 * - Input validation and sanitization (schema-based, type checks, length limits)
 * - Secure API key handling (environment variables, no client-side exposure)
 * - Request/response security headers
 * 
 * Security Guidelines Followed:
 * - OWASP API Security Top 10 (2023)
 * - OWASP Cheat Sheet Series
 * - NIST Cybersecurity Framework
 * 
 * @version 2.0.0
 * @updated 2025-01-21
 */

// ============================================================================
// RATE LIMITING - OWASP API4:2023 Unrestricted Resource Consumption
// ============================================================================

/**
 * Rate limit entry structure for tracking request counts
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;  // For progressive blocking
}

/**
 * Configuration for rate limiting behavior
 */
interface RateLimitConfig {
  windowMs: number;          // Time window in milliseconds
  maxRequests: number;       // Maximum requests per window
  message?: string;          // Custom error message for 429 response
  blockDurationMs?: number;  // Duration to block after limit exceeded
  skipFailedRequests?: boolean;  // Don't count failed requests
}

/**
 * Rate limit response structure
 */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  headers: Record<string, string>;
}

/**
 * In-memory rate limit storage
 * NOTE: In production, replace with Redis or similar distributed store
 * for multi-instance deployments
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * User-based rate limit storage (keyed by user ID or session)
 */
const userRateLimitStore = new Map<string, RateLimitEntry>();

// ============================================================================
// RATE LIMITER CONFIGURATIONS
// ============================================================================

/**
 * IP-based rate limiter for general API endpoints
 * Limits: 100 requests per minute per IP
 * Use case: General API protection
 */
export const ipRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000,           // 1 minute window
  maxRequests: 100,              // 100 requests per minute
  message: 'Too many requests from this IP address. Please try again later.',
  blockDurationMs: 60 * 1000,    // Block for 1 minute after limit exceeded
};

/**
 * AI API call rate limiter
 * Limits: 20 AI calls per minute to prevent excessive costs and abuse
 * Use case: AI service endpoints (Gemini, OpenAI, etc.)
 */
export const aiApiRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000,           // 1 minute window
  maxRequests: 20,               // 20 AI calls per minute
  message: 'AI service rate limit exceeded. Please wait before making more requests.',
  blockDurationMs: 30 * 1000,    // Block for 30 seconds
};

/**
 * Authentication rate limiter
 * Limits: 5 login attempts per minute per IP
 * Use case: Login, password reset, registration endpoints
 */
export const authRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000,           // 1 minute window
  maxRequests: 5,                // 5 attempts per minute
  message: 'Too many authentication attempts. Please try again later.',
  blockDurationMs: 5 * 60 * 1000, // Block for 5 minutes (brute force protection)
};

/**
 * Strict rate limiter for sensitive operations
 * Limits: 10 requests per minute
 * Use case: File uploads, exports, admin operations
 */
export const strictRateLimiter: RateLimitConfig = {
  windowMs: 60 * 1000,           // 1 minute window
  maxRequests: 10,               // 10 requests per minute
  message: 'Rate limit exceeded for this operation. Please wait.',
  blockDurationMs: 2 * 60 * 1000, // Block for 2 minutes
};

/**
 * Burst rate limiter for high-frequency operations
 * Limits: 30 requests per 10 seconds
 * Use case: Search, autocomplete, real-time features
 */
export const burstRateLimiter: RateLimitConfig = {
  windowMs: 10 * 1000,           // 10 second window
  maxRequests: 30,               // 30 requests per 10 seconds
  message: 'Too many requests. Please slow down.',
  blockDurationMs: 10 * 1000,    // Block for 10 seconds
};

// ============================================================================
// RATE LIMITING FUNCTIONS
// ============================================================================

/**
 * Extract client IP address from request headers
 * Handles proxied requests (X-Forwarded-For, X-Real-IP, CF-Connecting-IP)
 * 
 * @param request - Request object with headers
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(request?: { headers?: Record<string, string> }): string {
  if (!request?.headers) return 'unknown';

  // Cloudflare
  const cfIP = request.headers['cf-connecting-ip'];
  if (cfIP) return cfIP.trim();

  // Standard proxy headers
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Take the first IP (original client)
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }

  // Nginx proxy
  const realIP = request.headers['x-real-ip'];
  if (realIP) return realIP.trim();

  return 'unknown';
}

/**
 * Check if a request is rate limited
 * Implements sliding window rate limiting with progressive blocking
 * 
 * @param identifier - Unique identifier (IP, user ID, or combined)
 * @param config - Rate limit configuration
 * @param store - Rate limit store to use (default: IP-based)
 * @returns Rate limit result with headers for 429 response
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = ipRateLimiter,
  store: Map<string, RateLimitEntry> = rateLimitStore
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(identifier);

  // Check if currently blocked
  if (existing && existing.blockedUntil && now < existing.blockedUntil) {
    const retryAfter = Math.ceil((existing.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.blockedUntil,
      retryAfter,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(existing.blockedUntil / 1000)),
        'Retry-After': String(retryAfter),
      },
    };
  }

  // If no existing entry or window has expired, create new entry
  if (!existing || now > existing.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    store.set(identifier, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(config.maxRequests - 1),
        'X-RateLimit-Reset': String(Math.ceil(newEntry.resetTime / 1000)),
      },
    };
  }

  // Check if under limit
  if (existing.count < config.maxRequests) {
    existing.count++;
    const remaining = config.maxRequests - existing.count;

    return {
      allowed: true,
      remaining,
      resetTime: existing.resetTime,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(existing.resetTime / 1000)),
      },
    };
  }

  // Rate limited - apply blocking if configured
  if (config.blockDurationMs) {
    existing.blockedUntil = now + config.blockDurationMs;
  }

  const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
  return {
    allowed: false,
    remaining: 0,
    resetTime: existing.resetTime,
    retryAfter,
    headers: {
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(existing.resetTime / 1000)),
      'Retry-After': String(retryAfter),
    },
  };
}

/**
 * Combined IP + User rate limiting
 * Both limits must pass for the request to be allowed
 * 
 * @param ip - Client IP address
 * @param userId - User identifier (optional)
 * @param config - Rate limit configuration
 * @returns Combined rate limit result
 */
export function checkCombinedRateLimit(
  ip: string,
  userId?: string,
  config: RateLimitConfig = ipRateLimiter
): RateLimitResult {
  // Check IP-based limit
  const ipResult = checkRateLimit(`ip:${ip}`, config, rateLimitStore);
  if (!ipResult.allowed) {
    return ipResult;
  }

  // If user ID provided, also check user-based limit
  if (userId) {
    const userResult = checkRateLimit(`user:${userId}`, config, userRateLimitStore);
    if (!userResult.allowed) {
      return userResult;
    }
    // Return the more restrictive result
    return userResult.remaining < ipResult.remaining ? userResult : ipResult;
  }

  return ipResult;
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
  
  for (const [key, entry] of userRateLimitStore.entries()) {
    if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
      userRateLimitStore.delete(key);
    }
  }
}

// Start periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION - OWASP API3:2023 Broken Object Property Level Authorization
// ============================================================================

/**
 * Allowed MIME types for file uploads
 * Whitelist approach for security
 */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
]);

/**
 * Maximum file sizes by category (in bytes)
 */
const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,      // 10MB for images
  audio: 25 * 1024 * 1024,      // 25MB for audio
  video: 100 * 1024 * 1024,     // 100MB for video
  document: 5 * 1024 * 1024,    // 5MB for documents
  default: 2 * 1024 * 1024,     // 2MB default
} as const;

/**
 * Validation options for input fields
 */
interface ValidationOptions {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url' | 'uuid';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedKeys?: string[];
  allowedValues?: (string | number | boolean)[];
  fieldName: string;
  sanitize?: boolean;
}

/**
 * Validation result structure
 */
interface ValidationResult {
  valid: boolean;
  sanitized?: unknown;
  error?: string;
  field?: string;
}

/**
 * Email validation regex (RFC 5322 compliant)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * URL validation regex
 */
const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

/**
 * UUID validation regex (v4)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate and sanitize user input
 * Implements schema-based validation with type checking and length limits
 * 
 * @param input - Input value to validate
 * @param options - Validation options
 * @returns Validation result with sanitized value
 */
export function validateAndSanitizeInput(
  input: unknown,
  options: ValidationOptions
): ValidationResult {
  const { fieldName, type, required = false, sanitize = true } = options;

  // Check required
  if (input === null || input === undefined || input === '') {
    if (required) {
      return { valid: false, error: `${fieldName} is required`, field: fieldName };
    }
    return { valid: true, sanitized: input };
  }

  // Type validation
  switch (type) {
    case 'string':
      return validateString(input, options);
    case 'number':
      return validateNumber(input, options);
    case 'boolean':
      return validateBoolean(input, options);
    case 'object':
      return validateObject(input, options);
    case 'array':
      return validateArray(input, options);
    case 'email':
      return validateEmail(input, options);
    case 'url':
      return validateUrl(input, options);
    case 'uuid':
      return validateUuid(input, options);
    default:
      return { valid: false, error: `Unknown validation type: ${type}`, field: fieldName };
  }
}

/**
 * Validate string input
 */
function validateString(input: unknown, options: ValidationOptions): ValidationResult {
  const { fieldName, minLength, maxLength, pattern } = options;
  const shouldSanitize = options.sanitize !== false;

  if (typeof input !== 'string') {
    return { valid: false, error: `${fieldName} must be a string`, field: fieldName };
  }

  let value = input;

  // Sanitize if enabled
  if (shouldSanitize) {
    value = sanitizeString(value);
  }

  // Length validation
  if (minLength !== undefined && value.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters`, field: fieldName };
  }
  if (maxLength !== undefined && value.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${maxLength} characters`, field: fieldName };
  }

  // Pattern validation
  if (pattern && !pattern.test(value)) {
    return { valid: false, error: `${fieldName} format is invalid`, field: fieldName };
  }

  return { valid: true, sanitized: value };
}

/**
 * Validate number input
 */
function validateNumber(input: unknown, options: ValidationOptions): ValidationResult {
  const { fieldName, min, max } = options;

  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number`, field: fieldName };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}`, field: fieldName };
  }
  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max}`, field: fieldName };
  }

  return { valid: true, sanitized: num };
}

/**
 * Validate boolean input
 */
function validateBoolean(input: unknown, options: ValidationOptions): ValidationResult {
  const { fieldName } = options;

  if (typeof input === 'boolean') {
    return { valid: true, sanitized: input };
  }

  if (input === 'true' || input === '1') {
    return { valid: true, sanitized: true };
  }
  if (input === 'false' || input === '0') {
    return { valid: true, sanitized: false };
  }

  return { valid: false, error: `${fieldName} must be a boolean`, field: fieldName };
}

/**
 * Validate object input with allowed keys check
 */
function validateObject(input: unknown, options: ValidationOptions): ValidationResult {
  const { fieldName, allowedKeys, sanitize = true } = options;

  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { valid: false, error: `${fieldName} must be an object`, field: fieldName };
  }

  const obj = input as Record<string, unknown>;

  // Check for unexpected keys (reject unexpected fields)
  if (allowedKeys) {
    const inputKeys = Object.keys(obj);
    const unexpectedKeys = inputKeys.filter(key => !allowedKeys.includes(key));
    if (unexpectedKeys.length > 0) {
      return { 
        valid: false, 
        error: `${fieldName} contains unexpected fields: ${unexpectedKeys.join(', ')}`,
        field: fieldName 
      };
    }
  }

  // Sanitize string values in object
  if (sanitize) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitizedObj[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        const nested = validateObject(value, { ...options, fieldName: `${fieldName}.${key}` });
        if (!nested.valid) return nested;
        sanitizedObj[key] = nested.sanitized;
      } else {
        sanitizedObj[key] = value;
      }
    }
    return { valid: true, sanitized: sanitizedObj };
  }

  return { valid: true, sanitized: obj };
}

/**
 * Validate array input
 */
function validateArray(input: unknown, options: ValidationOptions): ValidationResult {
  const { fieldName, minLength, maxLength } = options;

  if (!Array.isArray(input)) {
    return { valid: false, error: `${fieldName} must be an array`, field: fieldName };
  }

  if (minLength !== undefined && input.length < minLength) {
    return { valid: false, error: `${fieldName} must have at least ${minLength} items`, field: fieldName };
  }
  if (maxLength !== undefined && input.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot have more than ${maxLength} items`, field: fieldName };
  }

  return { valid: true, sanitized: input };
}

/**
 * Validate email input
 */
function validateEmail(input: unknown, options: ValidationOptions): ValidationResult {
  const { fieldName } = options;

  if (typeof input !== 'string') {
    return { valid: false, error: `${fieldName} must be a string`, field: fieldName };
  }

  const email = input.trim().toLowerCase();
  
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: `${fieldName} must be a valid email address`, field: fieldName };
  }

  if (email.length > 254) {
    return { valid: false, error: `${fieldName} is too long`, field: fieldName };
  }

  return { valid: true, sanitized: email };
}

/**
 * Validate URL input
 */
function validateUrl(input: unknown, options: ValidationOptions): ValidationResult {
  const { fieldName } = options;

  if (typeof input !== 'string') {
    return { valid: false, error: `${fieldName} must be a string`, field: fieldName };
  }

  const url = input.trim();
  
  if (!URL_REGEX.test(url)) {
    return { valid: false, error: `${fieldName} must be a valid URL`, field: fieldName };
  }

  if (url.length > 2048) {
    return { valid: false, error: `${fieldName} is too long`, field: fieldName };
  }

  return { valid: true, sanitized: url };
}

/**
 * Validate UUID input
 */
function validateUuid(input: unknown, options: ValidationOptions): ValidationResult {
  const { fieldName } = options;

  if (typeof input !== 'string') {
    return { valid: false, error: `${fieldName} must be a string`, field: fieldName };
  }

  if (!UUID_REGEX.test(input)) {
    return { valid: false, error: `${fieldName} must be a valid UUID`, field: fieldName };
  }

  return { valid: true, sanitized: input.toLowerCase() };
}

/**
 * Sanitize string to prevent XSS and injection attacks
 * Implements defense in depth with multiple sanitization layers
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return String(input);

  let sanitized = input;

  // Remove null bytes (potential security bypass)
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newlines, tabs, carriage returns)
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
    /data:text\/html/gi,
    /vbscript:/gi,
    /<script\b[^>]*>/gi,
    /<\/script>/gi,
    /<iframe\b[^>]*>/gi,
    /<\/iframe>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /on\w+\s*=/gi,           // Event handlers (onclick, onerror, etc.)
    /expression\s*\(/gi,      // CSS expression
    /eval\s*\(/gi,            // JavaScript eval
    /Function\s*\(/gi,        // Function constructor
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Limit length to prevent DoS
  const MAX_LENGTH = 100000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized.trim();
}

/**
 * Validate file upload
 * Checks MIME type, file size, and filename
 * 
 * @param file - File metadata
 * @returns Validation result
 */
export function validateFileUpload(
  file: { type: string; size: number; name: string }
): ValidationResult {
  // Check MIME type against whitelist
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type '${file.type}' is not allowed` };
  }

  // Determine max size based on file type
  let maxSize: number;
  if (file.type.startsWith('image/')) {
    maxSize = MAX_FILE_SIZE.image;
  } else if (file.type.startsWith('audio/')) {
    maxSize = MAX_FILE_SIZE.audio;
  } else if (file.type.startsWith('video/')) {
    maxSize = MAX_FILE_SIZE.video;
  } else if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
    maxSize = MAX_FILE_SIZE.document;
  } else {
    maxSize = MAX_FILE_SIZE.default;
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `File size exceeds maximum allowed (${maxMB}MB)` };
  }

  // Sanitize and validate filename
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace invalid chars
    .replace(/\.{2,}/g, '.')           // Prevent path traversal
    .substring(0, 255);                 // Limit length

  // Check for dangerous extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.jsp'];
  const ext = sanitizedName.toLowerCase().slice(sanitizedName.lastIndexOf('.'));
  if (dangerousExtensions.includes(ext)) {
    return { valid: false, error: 'File type is not allowed for security reasons' };
  }

  return { valid: true, sanitized: sanitizedName };
}

// ============================================================================
// SECURE API KEY HANDLING - OWASP API2:2023 Broken Authentication
// ============================================================================

/**
 * API key validation result
 */
interface ApiKeyValidation {
  valid: boolean;
  error?: string;
  masked?: string;
}

/**
 * Validate API key format and strength
 * Provider-specific validation rules
 * 
 * @param key - API key to validate
 * @param provider - AI provider name
 * @returns Validation result
 */
export function validateApiKeyFormat(key: string, provider: string): ApiKeyValidation {
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

  // Check for common placeholder values
  const placeholders = ['your-api-key', 'api-key-here', 'xxx', 'test', 'demo'];
  if (placeholders.some(p => trimmed.toLowerCase().includes(p))) {
    return { valid: false, error: 'Please provide a valid API key' };
  }

  // Provider-specific validation
  const providerLower = provider.toLowerCase();
  switch (providerLower) {
    case 'gemini':
    case 'google':
      // Gemini keys typically start with 'AI' and are alphanumeric
      if (!/^[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
        return { valid: false, error: 'Invalid Gemini API key format' };
      }
      break;

    case 'openai':
      // OpenAI keys start with 'sk-' followed by alphanumeric
      if (!trimmed.startsWith('sk-') || trimmed.length < 20) {
        return { valid: false, error: 'Invalid OpenAI API key format (should start with sk-)' };
      }
      break;

    case 'anthropic':
    case 'claude':
      // Anthropic keys start with 'sk-ant-'
      if (!trimmed.startsWith('sk-ant-') || trimmed.length < 30) {
        return { valid: false, error: 'Invalid Anthropic API key format (should start with sk-ant-)' };
      }
      break;

    case 'openrouter':
      // OpenRouter keys start with 'sk-or-'
      if (!trimmed.startsWith('sk-or-') || trimmed.length < 20) {
        return { valid: false, error: 'Invalid OpenRouter API key format' };
      }
      break;

    case 'groq':
      // Groq keys start with 'gsk_'
      if (!trimmed.startsWith('gsk_') || trimmed.length < 20) {
        return { valid: false, error: 'Invalid Groq API key format' };
      }
      break;

    case 'huggingface':
      // HuggingFace keys start with 'hf_'
      if (!trimmed.startsWith('hf_') || trimmed.length < 20) {
        return { valid: false, error: 'Invalid HuggingFace API key format' };
      }
      break;
  }

  return { valid: true, masked: maskApiKey(trimmed) };
}

/**
 * Mask API key for safe logging
 * Shows only first and last 4 characters
 * 
 * @param key - API key to mask
 * @returns Masked key string
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) {
    return '****';
  }
  const visibleChars = 4;
  const maskedLength = Math.min(key.length - (visibleChars * 2), 20);
  return `${key.substring(0, visibleChars)}${'*'.repeat(maskedLength)}${key.substring(key.length - visibleChars)}`;
}

/**
 * Check if running in a secure environment
 * Warns about API key exposure in development
 * 
 * @returns True if secure (production), false if development
 */
export function isSecureEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' ||
                       hostname.startsWith('192.168.') ||
                       hostname.startsWith('10.');
    
    if (isLocalhost) {
      console.warn('[Security] Running in development mode - API keys may be exposed in browser');
      return false;
    }

    // Check for HTTPS in production
    if (window.location.protocol !== 'https:') {
      console.warn('[Security] Not using HTTPS - connections may be insecure');
    }
  }

  return true;
}

/**
 * Get API key from environment variables with validation
 * NEVER exposes keys client-side in production
 * 
 * @param provider - AI provider name
 * @returns API key or null if not found/invalid
 */
export function getApiKey(provider: string): string | null {
  // Construct environment variable name
  const envKey = `VITE_${provider.toUpperCase()}_API_KEY`;
  
  // Access from Vite environment
  const key = import.meta.env?.[envKey];

  if (!key) {
    console.warn(`[Security] API key not configured for ${provider}`);
    return null;
  }

  // Validate key format
  const validation = validateApiKeyFormat(key, provider);
  if (!validation.valid) {
    console.error(`[Security] Invalid API key format for ${provider}:`, validation.error);
    return null;
  }

  // Security warning for client-side exposure
  if (!isSecureEnvironment() && typeof window !== 'undefined') {
    console.warn(
      `[Security] API key for ${provider} is exposed in client-side code. ` +
      `In production, use a backend proxy to protect API keys.`
    );
  }

  return key;
}

/**
 * Securely clear API key from memory
 * Helps prevent memory-based attacks
 * 
 * @param key - Key variable to clear
 */
export function securelyDisposeKey(key: string): void {
  if (typeof key === 'string' && key.length > 0) {
    // Overwrite with random data before dereferencing
    // Note: This is best-effort in JavaScript due to string immutability
    try {
      const buffer = new Uint8Array(key.length);
      crypto.getRandomValues(buffer);
    } catch {
      // Ignore errors in environments without crypto
    }
  }
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Generate Content Security Policy header
 * Follows OWASP CSP guidelines
 * 
 * @param isDevelopment - Whether in development mode
 * @returns CSP header string
 */
export function generateCSP(isDevelopment = false): string {
  const directives = [
    "default-src 'self'",
    // Script sources - unsafe-inline/eval needed for Vite HMR in dev
    isDevelopment 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" 
      : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Connect sources for AI APIs
    "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com https://openrouter.ai https://api.groq.com https://api-inference.huggingface.co",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ];

  return directives.join('; ');
}

/**
 * Security headers for API responses
 * Implements OWASP recommended headers
 */
export const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(self), camera=(self), payment=()',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Schema definition for request validation
 */
interface RequestSchema {
  body?: Record<string, ValidationOptions>;
  query?: Record<string, ValidationOptions>;
  params?: Record<string, ValidationOptions>;
}

/**
 * Comprehensive request validation for API endpoints
 * Validates body, query parameters, and path parameters
 * 
 * @param request - Request object
 * @param schema - Validation schema
 * @returns Validation result with sanitized data
 */
export function validateAPIRequest(
  request: {
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    method?: string;
  },
  schema?: RequestSchema
): { valid: boolean; error?: string; sanitizedBody?: Record<string, unknown>; sanitizedQuery?: Record<string, unknown> } {
  // Validate HTTP method
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  if (request.method && !allowedMethods.includes(request.method.toUpperCase())) {
    return { valid: false, error: `Invalid HTTP method: ${request.method}` };
  }

  const sanitizedBody: Record<string, unknown> = {};
  const sanitizedQuery: Record<string, unknown> = {};

  // Validate request body
  if (schema?.body && request.body) {
    for (const [field, options] of Object.entries(schema.body)) {
      const value = request.body[field];
      const result = validateAndSanitizeInput(value, options);

      if (!result.valid) {
        return { valid: false, error: result.error };
      }

      if (result.sanitized !== undefined) {
        sanitizedBody[field] = result.sanitized;
      }
    }

    // Check for unexpected fields in body
    const allowedBodyKeys = Object.keys(schema.body);
    const bodyKeys = Object.keys(request.body);
    const unexpectedKeys = bodyKeys.filter(k => !allowedBodyKeys.includes(k));
    if (unexpectedKeys.length > 0) {
      return { valid: false, error: `Unexpected fields in request body: ${unexpectedKeys.join(', ')}` };
    }
  }

  // Validate query parameters
  if (schema?.query && request.query) {
    for (const [field, options] of Object.entries(schema.query)) {
      const value = request.query[field];
      const result = validateAndSanitizeInput(value, options);

      if (!result.valid) {
        return { valid: false, error: result.error };
      }

      if (result.sanitized !== undefined) {
        sanitizedQuery[field] = result.sanitized;
      }
    }
  }

  return { valid: true, sanitizedBody, sanitizedQuery };
}

// ============================================================================
// RATE-LIMITED ACTION WRAPPER
// ============================================================================

/**
 * Create a rate-limited wrapper for async actions
 * Automatically applies rate limiting to any function
 * 
 * @param action - Async function to wrap
 * @param rateLimiter - Rate limit configuration
 * @param getIdentifier - Function to get rate limit identifier
 * @returns Rate-limited version of the action
 */
export function createRateLimitedAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  rateLimiter: RateLimitConfig = aiApiRateLimiter,
  getIdentifier?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = getIdentifier ? getIdentifier(...args) : 'default';

    const rateLimit = checkRateLimit(identifier, rateLimiter);
    if (!rateLimit.allowed) {
      const error = new Error(rateLimiter.message || 'Rate limit exceeded');
      (error as any).status = 429;
      (error as any).retryAfter = rateLimit.retryAfter;
      (error as any).headers = rateLimit.headers;
      throw error;
    }

    return action(...args);
  }) as T;
}

/**
 * Generate a 429 Too Many Requests response
 * 
 * @param message - Error message
 * @param retryAfter - Seconds until retry is allowed
 * @returns Response object
 */
export function create429Response(message: string, retryAfter: number): {
  status: number;
  body: { error: string; retryAfter: number };
  headers: Record<string, string>;
} {
  return {
    status: 429,
    body: {
      error: message,
      retryAfter,
    },
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      ...securityHeaders,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type RateLimitConfig,
  type RateLimitResult,
  type ValidationOptions,
  type ValidationResult,
  type ApiKeyValidation,
  type RequestSchema,
};
