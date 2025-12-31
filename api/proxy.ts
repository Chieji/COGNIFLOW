/**
 * Secure API Proxy Handler
 * 
 * This handler proxies AI API requests from the client to the actual AI providers.
 * API keys are stored securely as environment variables on the server side.
 * 
 * Deploy to:
 * - Vercel: Place in /api directory
 * - Cloudflare Workers: Adapt to worker format
 * - Local: Run with Node.js + Express
 * 
 * Usage:
 * POST /api/proxy
 * Body: { provider: 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'huggingface' | 'universal', payload: any }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Type definitions for requests
interface ProxyRequest {
  provider: 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'groq' | 'huggingface' | 'universal';
  payload: any;
  endpoint?: string;
}

/**
 * Map provider names to their API endpoints and authentication headers.
 */
const PROVIDER_CONFIG: Record<string, { endpoint: string; keyEnv: string; headers: Record<string, string> }> = {
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyEnv: 'GEMINI_API_KEY',
    headers: { 'Content-Type': 'application/json' },
  },
  openai: {
    endpoint: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
    headers: { 'Content-Type': 'application/json' },
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1',
    keyEnv: 'ANTHROPIC_API_KEY',
    headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
  },
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
    headers: { 'Content-Type': 'application/json' },
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    headers: { 'Content-Type': 'application/json' },
  },
  huggingface: {
    endpoint: 'https://api-inference.huggingface.co',
    keyEnv: 'HUGGINGFACE_API_KEY',
    headers: { 'Content-Type': 'application/json' },
  },
  universal: {
    endpoint: process.env.UNIVERSAL_BASE_URL || 'https://api.example.com',
    keyEnv: 'UNIVERSAL_API_KEY',
    headers: { 'Content-Type': 'application/json' },
  },
};

/**
 * Validate the incoming request to ensure it's from an authorized source.
 */
function validateRequest(req: VercelRequest): boolean {
  // Add CORS validation if needed
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && !allowedOrigins.some(allowed => origin.includes(allowed))) {
    return false;
  }
  
  return true;
}

/**
 * Main proxy handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate request origin
    if (!validateRequest(req)) {
      return res.status(403).json({ error: 'Forbidden: Origin not allowed' });
    }

    const { provider, payload, endpoint } = req.body as ProxyRequest;

    // Validate provider
    if (!provider || !PROVIDER_CONFIG[provider]) {
      return res.status(400).json({ error: 'Invalid or missing provider' });
    }

    const config = PROVIDER_CONFIG[provider];
    const apiKey = process.env[config.keyEnv];

    if (!apiKey) {
      console.error(`Missing API key for provider: ${provider}`);
      return res.status(500).json({ error: `API key not configured for ${provider}` });
    }

    // Build request headers
    const headers: Record<string, string> = { ...config.headers };

    if (provider === 'gemini') {
      headers['x-goog-api-key'] = apiKey;
    } else if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Construct the full URL
    const fullEndpoint = endpoint ? `${config.endpoint}${endpoint}` : config.endpoint;

    // Forward the request to the AI provider
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Provider error (${provider}):`, errorBody);
      return res.status(response.status).json({
        error: `Provider returned error: ${response.statusText}`,
        details: errorBody,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
