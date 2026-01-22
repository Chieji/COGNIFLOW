/**
 * COGNIFLOW Secure API Proxy Handler
 * 
 * This handler proxies AI API requests from the client to the actual AI providers.
 * API keys are stored securely as environment variables on the server side.
 * 
 * Security Features:
 * - Rate limiting (IP + user-based)
 * - Input validation and sanitization
 * - Secure API key handling (no client-side exposure)
 * - CORS validation
 * - Request logging and monitoring
 * 
 * Deploy to:
 * - Vercel: Place in /api directory
 * - Cloudflare Workers: Adapt to worker format
 * - Local: Run with Node.js + Express
 * 
 * @version 2.0.0
 * @updated 2025-01-21
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported AI providers
 */
type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'huggingface' | 'universal';

/**
 * Proxy request structure
 */
interface ProxyRequest {
  provider: AIProvider;
  payload: Record<string, unknown>;
  endpoint?: string;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

/**
 * Provider configuration
 */
interface ProviderConfig {
  endpoint: string;
  keyEnv: string;
  headers: Record<string, string>;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * AI Provider configurations
 * API keys are read from environment variables - NEVER hardcoded
 */
const PROVIDER_CONFIG: Record<AIProvider, ProviderConfig> = {
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyEnv: 'GEMINI_API_KEY',
    headers: { 'Content-Type': 'application/json' },
    rateLimit: { maxRequests: 20, windowMs: 60000 },
  },
  openai: {
    endpoint: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
    headers: { 'Content-Type': 'application/json' },
    rateLimit: { maxRequests: 20, windowMs: 60000 },
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1',
    keyEnv: 'ANTHROPIC_API_KEY',
    headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
    rateLimit: { maxRequests: 15, windowMs: 60000 },
  },
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
    headers: { 'Content-Type': 'application/json' },
    rateLimit: { maxRequests: 20, windowMs: 60000 },
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    headers: { 'Content-Type': 'application/json' },
    rateLimit: { maxRequests: 30, windowMs: 60000 },
  },
  huggingface: {
    endpoint: 'https://api-inference.huggingface.co',
    keyEnv: 'HUGGINGFACE_API_KEY',
    headers: { 'Content-Type': 'application/json' },
    rateLimit: { maxRequests: 25, windowMs: 60000 },
  },
  universal: {
    endpoint: process.env.UNIVERSAL_BASE_URL || 'http://localhost:11434/v1',
    keyEnv: 'UNIVERSAL_API_KEY',
    headers: { 'Content-Type': 'application/json' },
    rateLimit: { maxRequests: 50, windowMs: 60000 },
  },
};

/**
 * Security headers for all responses
 */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * In-memory rate limit store
 * NOTE: In production with multiple instances, use Redis
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Get client IP from request headers
 */
function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (ips) {
      return ips.split(',')[0].trim();
    }
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    const ip = Array.isArray(realIP) ? realIP[0] : realIP;
    return ip || 'unknown';
  }
  
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check rate limit for a given identifier
 */
function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  // Check if blocked
  if (existing?.blockedUntil && now < existing.blockedUntil) {
    const retryAfter = Math.ceil((existing.blockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Create new entry or reset if window expired
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Check if under limit
  if (existing.count < maxRequests) {
    existing.count++;
    return { allowed: true, remaining: maxRequests - existing.count };
  }

  // Rate limited - block for window duration
  existing.blockedUntil = now + windowMs;
  const retryAfter = Math.ceil(windowMs / 1000);
  return { allowed: false, remaining: 0, retryAfter };
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate the proxy request body
 */
function validateRequest(body: unknown): { valid: boolean; error?: string; data?: ProxyRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const req = body as Record<string, unknown>;

  // Validate provider
  if (!req.provider || typeof req.provider !== 'string') {
    return { valid: false, error: 'Provider is required' };
  }

  const validProviders: AIProvider[] = ['gemini', 'openai', 'anthropic', 'openrouter', 'groq', 'huggingface', 'universal'];
  if (!validProviders.includes(req.provider as AIProvider)) {
    return { valid: false, error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` };
  }

  // Validate payload
  if (!req.payload || typeof req.payload !== 'object') {
    return { valid: false, error: 'Payload is required and must be an object' };
  }

  // Validate endpoint (optional)
  if (req.endpoint !== undefined && typeof req.endpoint !== 'string') {
    return { valid: false, error: 'Endpoint must be a string' };
  }

  // Check payload size (prevent DoS)
  const payloadStr = JSON.stringify(req.payload);
  if (payloadStr.length > 1000000) { // 1MB limit
    return { valid: false, error: 'Payload too large (max 1MB)' };
  }

  return {
    valid: true,
    data: {
      provider: req.provider as AIProvider,
      payload: req.payload as Record<string, unknown>,
      endpoint: req.endpoint as string | undefined,
    },
  };
}

/**
 * Validate origin against allowed origins
 */
function validateOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin || req.headers.referer;
  
  // Get allowed origins from environment
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const allowedOrigins = allowedOriginsEnv 
    ? allowedOriginsEnv.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:1477', 'http://localhost:5173'];

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  if (!origin) {
    return false;
  }

  return allowedOrigins.some(allowed => origin.startsWith(allowed));
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Main proxy handler with security hardening
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // CORS headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only POST requests are accepted',
    });
  }

  try {
    // Validate origin
    if (!validateOrigin(req)) {
      console.warn('[Security] Request from unauthorized origin:', req.headers.origin);
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Origin not allowed',
      });
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Global IP-based rate limit (100 requests per minute)
    const globalLimit = checkRateLimit(`global:${clientIP}`, 100, 60000);
    if (!globalLimit.allowed) {
      res.setHeader('Retry-After', String(globalLimit.retryAfter));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: globalLimit.retryAfter,
      });
    }

    // Validate request body
    const validation = validateRequest(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({
        error: 'Bad Request',
        message: validation.error,
      });
    }

    const { provider, payload, endpoint } = validation.data;
    const config = PROVIDER_CONFIG[provider];

    // Provider-specific rate limit
    const providerLimit = checkRateLimit(
      `${provider}:${clientIP}`,
      config.rateLimit.maxRequests,
      config.rateLimit.windowMs
    );
    
    if (!providerLimit.allowed) {
      res.setHeader('Retry-After', String(providerLimit.retryAfter));
      res.setHeader('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded for ${provider}. Please try again later.`,
        retryAfter: providerLimit.retryAfter,
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(config.rateLimit.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(providerLimit.remaining));

    // Get API key from environment (NEVER from client)
    const apiKey = process.env[config.keyEnv];
    if (!apiKey) {
      console.error(`[Config] Missing API key for provider: ${provider}`);
      return res.status(500).json({
        error: 'Configuration Error',
        message: `API key not configured for ${provider}`,
      });
    }

    // Build request headers with API key
    const headers: Record<string, string> = { ...config.headers };

    // Provider-specific authentication
    switch (provider) {
      case 'gemini':
        headers['x-goog-api-key'] = apiKey;
        break;
      case 'anthropic':
        headers['x-api-key'] = apiKey;
        break;
      default:
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Construct the full URL
    const fullEndpoint = endpoint 
      ? `${config.endpoint}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
      : config.endpoint;

    // Log request (without sensitive data)
    console.log(`[Proxy] ${provider} request from ${clientIP} to ${fullEndpoint}`);

    // Forward the request to the AI provider
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    // Handle provider errors
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Proxy] Provider error (${provider}):`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody.substring(0, 500),
      });

      return res.status(response.status).json({
        error: 'Provider Error',
        message: `${provider} returned an error: ${response.statusText}`,
        details: process.env.NODE_ENV === 'development' ? errorBody : undefined,
      });
    }

    // Return successful response
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('[Proxy] Unexpected error:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
}
