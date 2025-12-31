import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 1477,
        host: '0.0.0.0',
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
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
