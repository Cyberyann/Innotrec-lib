import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    sourcemap: true,
    rollupOptions: {
      // peer dependencies are provided by the host application
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-router'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: { include: ['src/**/*.{ts,tsx}'], exclude: ['src/test/**', 'src/**/*.test.*'] },
  },
});
