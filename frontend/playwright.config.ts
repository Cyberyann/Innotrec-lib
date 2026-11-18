import { defineConfig, devices } from '@playwright/test';

/**
 * Two modes:
 *  - default: the Vite dev server + a mocked API (page.route) — fast, no backend needed (CI)
 *  - E2E_STACK=1: real stack (docker compose) at E2E_BASE_URL, e-mails read from Mailpit
 */
const stack = !!process.env.E2E_STACK;
const baseURL = stack
  ? (process.env.E2E_BASE_URL ?? 'http://localhost:8080')
  : 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  testMatch: stack ? '**/stack.spec.ts' : '**/*.spec.ts',
  testIgnore: stack ? [] : ['**/stack.spec.ts'],
  fullyParallel: !stack,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: stack
    ? undefined
    : {
        command: 'npx vite --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
