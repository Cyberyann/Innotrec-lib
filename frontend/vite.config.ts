import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.BACKEND_URL || 'http://localhost:8000';
  // In dev & tests, use the library sources directly (instant HMR on library changes).
  // Production builds use the built package (frontend_lib/dist), exactly like an external app.
  const useLibSources = mode !== 'production';
  return {
    plugins: [react()],
    resolve: {
      alias: useLibSources
        ? [
            {
              find: /^@innotrec\/ui$/,
              replacement: resolve(import.meta.dirname, '../frontend_lib/src/index.ts'),
            },
            {
              find: /^@innotrec\/ui\/styles\.css$/,
              replacement: resolve(import.meta.dirname, '../frontend_lib/src/styles/index.css'),
            },
          ]
        : [],
    },
    server: {
      port: 5173,
      // Same-origin in development: the browser only talks to Vite, which proxies /api.
      proxy: {
        '/api': { target: backend, changeOrigin: false },
        '/django-admin': { target: backend, changeOrigin: false },
        '/django-static': { target: backend, changeOrigin: false },
      },
    },
    build: { sourcemap: true },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
