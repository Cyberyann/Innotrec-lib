import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias:
      mode !== 'production'
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
  test: { globals: true, environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], css: false },
}));
