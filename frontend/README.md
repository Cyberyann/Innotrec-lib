# Sample frontend (React)

Example application built with **@innotrec/ui**: login with 2FA, registration, e-mail verification, password reset, profile
(2FA settings, password, account deletion), staff user management, a dashboard with charts and a notes CRUD.

## Run

```bash
npm install                 # at the repository root (workspaces)
cp .env.example .env
npm run dev                 # http://localhost:5173, /api proxied to BACKEND_URL (Django on :8000)
```

In development `@innotrec/ui` is resolved to `../frontend_lib/src` (HMR on library changes); `npm run build` uses the built
package like any external application (`npm run build -w @innotrec/ui` first).

## Tests

```bash
npm test                    # Vitest: App routing / pages with a fake backend
npm run test:e2e            # Playwright: starts Vite, mocks the API (e2e/mockBackend.ts)
npm run test:e2e:stack      # Playwright against docker compose (E2E_BASE_URL, MAILPIT_URL)
```

Playwright needs Chromium system libraries. Either `npx playwright install --with-deps chromium`, or use the official image:

```bash
docker run --rm --ipc=host --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD/..":/work -w /work/frontend \
  mcr.microsoft.com/playwright:v1.65.1-noble npx playwright test
# full stack: add --network host -e E2E_STACK=1
```

## Environment

| Variable                          | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| `VITE_API_URL`                    | API root seen by the browser (`/api` behind the proxy)   |
| `VITE_APP_NAME`                   | Header title                                             |
| `VITE_DEFAULT_LOCALE`             | `en` or `fr`                                             |
| `VITE_REQUIRE_EMAIL_VERIFICATION` | Must match the backend                                   |
| `BACKEND_URL`                     | Dev only: Vite proxy target (not exposed to the browser) |

`VITE_*` values are embedded in the bundle at build time: never put secrets in them.
