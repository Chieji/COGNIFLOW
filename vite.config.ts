/**
 * COGNIFLOW Vite Configuration
 * 
 * Features:
 * - Environment-based port configuration
 * - Security headers
 * - PWA support
 * - Optimized build settings
 * 
 * @version 2.0.0
 * @updated 2025-01-21
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get port from environment variable or use default
  const port = parseInt(env.VITE_PORT || '1477', 10);
  
  // Determine if strict CSP should be enabled
  const strictCSP = env.VITE_STRICT_CSP === 'true';
  
  // Build Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    // Script sources - unsafe-inline/eval needed for Vite HMR in development
    mode === 'development' 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" 
      : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Connect sources for AI APIs
    "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com https://openrouter.ai https://api.groq.com https://api-inference.huggingface.co ws://localhost:* wss://localhost:*",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ];
  
  if (strictCSP) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  return {
    server: {
      // Port is now configurable via environment variable
      port,
      host: '0.0.0.0',
      strictPort: false, // Allow fallback to another port if specified port is in use
      hmr: {
        overlay: mode === 'development',
      },
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      },
      headers: {
        // Content Security Policy
        'Content-Security-Policy': cspDirectives.join('; '),
        
        // Prevent MIME type sniffing
        'X-Content-Type-Options': 'nosniff',
        
        // Prevent clickjacking
        'X-Frame-Options': 'DENY',
        
        // XSS protection (legacy browsers)
        'X-XSS-Protection': '1; mode=block',
        
        // Control referrer information
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        
        // Restrict browser features
        'Permissions-Policy': 'geolocation=(), microphone=(self), camera=(self), payment=()',
      },
    },
    
    // Preview server configuration (for production builds)
    preview: {
      port: port + 1000, // Preview on port + 1000 (e.g., 2477)
      host: '0.0.0.0',
    },
    
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: mode === 'development',
        },
        manifest: {
          name: 'COGNIFLOW',
          short_name: 'CogniFlow',
          description: 'AI-powered Second Brain & Development Studio',
          theme_color: '#3b82f6',
          background_color: '#0f172a',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'cogniflow-icon.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'cogniflow-icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Don't cache API responses in service worker
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gemini-api-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                networkTimeoutSeconds: 10,
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.tsx'),
        name: 'Cogniflow',
        formats: ['es', 'umd'],
        fileName: (format) => `cogniflow.${format === 'umd' ? 'umd' : 'es'}.js`
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM'
          }
        }
      },
      // Security: minimize attack surface in production
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs: mode === 'production' ? ['console.log', 'console.debug'] : [],
        },
        mangle: mode === 'production',
      },
      // Source maps only in development
      sourcemap: mode === 'development',
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    
    // Environment variable prefix
    envPrefix: 'VITE_',
    
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  };
});
