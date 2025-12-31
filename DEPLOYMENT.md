# COGNIFLOW Deployment Guide

This guide covers deploying COGNIFLOW and its secure API proxy to production environments.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Vercel Deployment](#vercel-deployment)
3. [Cloudflare Workers](#cloudflare-workers)
4. [Self-Hosted Deployment](#self-hosted-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Security Checklist](#security-checklist)

---

## Architecture Overview

COGNIFLOW consists of two main components:

1. **Frontend (Client):** React + TypeScript + Vite
   - Runs in the browser
   - Handles UI and local state management
   - Communicates with the proxy for AI requests

2. **Backend (Proxy):** Node.js API handler
   - Securely stores API keys
   - Routes requests to AI providers
   - Validates and sanitizes inputs

```
┌─────────────────────┐
│   COGNIFLOW Client  │
│  (React + Vite)     │
└──────────┬──────────┘
           │
           │ HTTPS
           │
┌──────────▼──────────┐
│   API Proxy Layer   │
│  (Vercel/Workers)   │
└──────────┬──────────┘
           │
           │ HTTPS
           │
    ┌──────┴──────┬──────────┬──────────┐
    │             │          │          │
┌───▼───┐ ┌──────▼─┐ ┌──────▼──┐ ┌────▼──┐
│Gemini │ │OpenAI  │ │Anthropic│ │Groq   │
└───────┘ └────────┘ └─────────┘ └───────┘
```

---

## Vercel Deployment

### Step 1: Push to GitHub

```bash
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the project root directory

### Step 3: Configure Environment Variables

In the Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Add the following variables:

```
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENROUTER_API_KEY=your_openrouter_key
GROQ_API_KEY=your_groq_key
HUGGINGFACE_API_KEY=your_huggingface_key
UNIVERSAL_API_KEY=your_universal_key
UNIVERSAL_BASE_URL=https://api.example.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your project
3. Your API proxy will be available at: `https://your-project.vercel.app/api/proxy`

### Step 5: Update Frontend Configuration

Update your `.env.local` file:

```
VITE_API_PROXY_URL=https://your-project.vercel.app/api/proxy
```

---

## Cloudflare Workers

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Create a Cloudflare Worker

```bash
wrangler init cogniflow-proxy
cd cogniflow-proxy
```

### Step 3: Adapt the Proxy Code

Create `src/index.ts` with the proxy handler adapted for Cloudflare Workers:

```typescript
/**
 * Cloudflare Workers version of the API proxy
 */

interface Env {
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  OPENROUTER_API_KEY: string;
  GROQ_API_KEY: string;
  HUGGINGFACE_API_KEY: string;
  UNIVERSAL_API_KEY: string;
  UNIVERSAL_BASE_URL: string;
}

const PROVIDER_CONFIG = {
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyEnv: 'GEMINI_API_KEY',
  },
  openai: {
    endpoint: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
  },
  // ... other providers
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const { provider, payload, endpoint } = await request.json();

      const config = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG];
      if (!config) {
        return new Response(JSON.stringify({ error: 'Invalid provider' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const apiKey = env[config.keyEnv as keyof Env];
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Forward request to provider
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (provider === 'gemini') {
        headers['x-goog-api-key'] = apiKey;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const fullEndpoint = endpoint ? `${config.endpoint}${endpoint}` : config.endpoint;

      const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
```

### Step 4: Configure wrangler.toml

```toml
name = "cogniflow-proxy"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.vars.secrets]]
GEMINI_API_KEY = "your_key"
OPENAI_API_KEY = "your_key"
# ... other keys
```

### Step 5: Deploy

```bash
wrangler deploy --env production
```

Your proxy will be available at: `https://cogniflow-proxy.your-domain.workers.dev`

---

## Self-Hosted Deployment

### Step 1: Set Up Node.js Server

Create `server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
}));

// Import the proxy handler
import handler from './api/proxy';

app.post('/api/proxy', (req, res) => {
  handler(req as any, res as any);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Proxy running on port ${PORT}`);
});
```

### Step 2: Install Dependencies

```bash
npm install express cors dotenv
npm install -D @types/express @types/node
```

### Step 3: Configure Environment

Create `.env`:

```
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
# ... other keys
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Step 4: Run the Server

```bash
npm run dev
```

### Step 5: Deploy with PM2

```bash
npm install -g pm2

pm2 start server.ts --name cogniflow-proxy
pm2 save
pm2 startup
```

---

## Environment Configuration

### Frontend (.env.local)

```
VITE_API_PROXY_URL=https://your-proxy-domain.com/api/proxy
```

### Backend (Environment Variables)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Anthropic Claude API key |
| `OPENROUTER_API_KEY` | No | OpenRouter API key |
| `GROQ_API_KEY` | No | Groq API key |
| `HUGGINGFACE_API_KEY` | No | Hugging Face API key |
| `UNIVERSAL_API_KEY` | No | Universal provider API key |
| `UNIVERSAL_BASE_URL` | No | Universal provider base URL |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed origins |

---

## Security Checklist

Before deploying to production, ensure:

- [ ] All API keys are stored as environment variables (never in code)
- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] CORS is configured to allow only your domain
- [ ] HTTPS is enabled for all endpoints
- [ ] Input validation is implemented
- [ ] Rate limiting is configured
- [ ] Error messages don't leak sensitive information
- [ ] Security headers are set (CSP, X-Frame-Options, etc.)
- [ ] Dependencies are up-to-date and audited
- [ ] Logging is configured for monitoring
- [ ] Backup and disaster recovery plan is in place

### Add Security Headers

For Vercel, create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## Monitoring and Logging

### Set Up Monitoring

1. **Error Tracking:** Use Sentry or similar service
2. **Performance Monitoring:** Use Vercel Analytics or Cloudflare Analytics
3. **Logging:** Use structured logging (e.g., Winston, Pino)

### Example Logging

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

logger.info({ provider, endpoint }, 'Proxy request received');
logger.error({ error }, 'Proxy request failed');
```

---

## Troubleshooting

### API Key Not Found

- Verify the environment variable name matches the code
- Check that the variable is set in the deployment platform
- Restart the server/function after updating variables

### CORS Errors

- Ensure your domain is in `ALLOWED_ORIGINS`
- Check that the proxy is returning CORS headers
- Verify the frontend is using the correct proxy URL

### Rate Limiting

- Implement rate limiting on the proxy to prevent abuse
- Use services like Cloudflare Rate Limiting or API Gateway throttling

---

## Support

For deployment issues, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Express.js Documentation](https://expressjs.com/)

---

**Last Updated:** December 31, 2025  
**Version:** 1.0
