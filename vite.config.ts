import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 1477,
        host: '0.0.0.0',
        headers: {
          // Content Security Policy (strict)
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Vite HMR
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com",
            "worker-src 'self' blob:",
          ].join('; '),

          // Additional security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        },
      },
      plugins: [react()],
      build: {
        lib: {
          entry: path.resolve(__dirname, 'index.tsx'),
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
        // Security: minimize attack surface
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production',
          },
        },
        // Enable source maps for debugging (only in dev)
        sourcemap: mode === 'development',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
