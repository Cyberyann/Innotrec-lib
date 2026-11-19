# Innotrec shared libraries

One repository for everything that Innotrec web applications share:

| Folder                           | What                                                                                                                          | Tech                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| [`backend_lib/`](backend_lib/)   | **`innotrec-auth`**: users, login, 2FA (TOTP / e-mail), password reset, CSRF, rate limiting, e-mail templates, user admin API | Django 5.2+/6, DRF      |
| [`frontend_lib/`](frontend_lib/) | **`@innotrec/ui`**: API client (CSRF), `useAuth`, route guards, auth screens, UI components (header, menu, chart…)            | React 18/19, TypeScript |
| [`backend/`](backend/)           | Sample Django project using `innotrec-auth` (a small "notes" API)                                                             | Django, gunicorn        |
| [`frontend/`](frontend/)         | Sample React app using `@innotrec/ui` + Playwright e2e tests                                                                  | Vite, React Router 7    |
| [`doc/`](doc/)                   | Documentation web app (installation, settings, components gallery, deployment, updates)                                       | Vite, React             |
| [`deploy/`](deploy/)             | docker compose: nginx proxy → SPA + doc + Django/gunicorn → PostgreSQL + Redis (+ Mailpit in dev)                             | Docker                  |
| [`scripts/`](scripts/)           | `release.sh` to version and tag a library                                                                                     | bash                    |

All applications built on these libraries **share the same PostgreSQL database for users**: one account works everywhere.

```
browser ─► nginx proxy ─┬─► /         React app (@innotrec/ui)
          (rate limit,  ├─► /doc/     documentation
           headers)     └─► /api/     Django + innotrec-auth ─► PostgreSQL (shared users) + Redis (throttling)
```

## Quick start (local development)

Requirements: Python ≥ 3.12, Node ≥ 20, (Docker for the full stack).

```bash
# backend
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
pip install -e backend_lib          # backend_lib installed in editable mode
cp backend/.env.example backend/.env                 # empty DATABASE_URL = sqlite
# Adapt .env
python backend/manage.py migrate
python backend/manage.py createsuperuser
python backend/manage.py runserver                   # http://localhost:8000

# frontend (npm workspaces: frontend_lib, frontend, doc)
npm install
cp frontend/.env.example frontend/.env
npm run dev:front                                    # http://localhost:5173 (proxies /api → :8000)
npm run dev:doc                                      # http://localhost:5174
```

E-mails (verification link, reset link, 2FA codes) are printed in the Django console in development.

## Full stack with Docker

```bash
cp deploy/.env.example deploy/.env                   # change the secrets
docker compose -f deploy/docker-compose.yml --profile dev up -d --build
# app http://localhost:8080 · docs http://localhost:8080/doc/ · e-mails http://localhost:8025
```

## Tests

| Command                                                               | Scope                                               |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| `cd backend_lib && pytest`                                            | library unit/API tests + e2e API journey (46 tests) |
| `cd backend && pytest`                                                | sample backend                                      |
| `npm test`                                                            | Vitest component tests (library + sample app)       |
| `npm test -w innotrec-doc`                                            | documentation smoke tests                           |
| `npm run test:e2e`                                                    | Playwright, browser e2e with mocked API             |
| `npm run test:e2e:stack -w innotrec-sample-frontend`                  | Playwright against the docker stack (reads Mailpit) |
| `black --check . && ruff check . && mypy innotrec_auth` (backend_lib) | formatting, lint, strict typing                     |
| `npm run lint && npm run typecheck && npm run format:check`           | ESLint, TypeScript, Prettier                        |

> Playwright needs system libraries: `npx playwright install --with-deps chromium`, or run it inside
> `mcr.microsoft.com/playwright` (see [`frontend/README.md`](frontend/README.md)).

## Security in a nutshell

HttpOnly session cookie (no token in JS) · CSRF on every unsafe call, including anonymous ones · origin allow-list
middleware + CORS · rate limiting in nginx **and** DRF (per second / per hour / per sensitive endpoint, shared in Redis) ·
2FA by authenticator app or e-mail code · strong password validators · no account enumeration · CSP and security headers ·
database and cache on an internal Docker network. Details: `doc` → _Security_.

## Updating the libraries

Semantic versioning, one changelog per library, tags `backend-vX.Y.Z` / `frontend-vX.Y.Z`:

```bash
./scripts/release.sh backend minor   # bump + changelog + commit + tag
git push && git push --tags          # .github/workflows/release.yml tests and publishes
```

Applications pin a version (`innotrec-auth @ git+…@backend-v1.1.0#subdirectory=backend_lib`, `@innotrec/ui@1.1.0` from GitHub
Packages) and upgrade with a one-line change. See `doc` → _Updating the libraries_.

## Editor

Open the folder in VS Code and accept the recommended extensions (`.vscode/extensions.json`): Black formats Python on save,
Prettier formats TypeScript/CSS/JSON/Markdown on save, ESLint fixes on save, Ruff organizes imports, mypy checks types.

## Conventions

- Python: every variable, attribute and function is type-annotated; `mypy --strict` must pass; Black (100 cols) + Ruff.
- TypeScript: `strict` + `noUncheckedIndexedAccess`; Prettier + ESLint.
- Never commit `.env` files — only `.env.example`.
