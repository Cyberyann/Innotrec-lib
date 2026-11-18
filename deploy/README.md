# Deployment (docker compose)

```
                 ┌───────────── web network ─────────────┐   ┌──── data network (internal) ────┐
browser ─► :8080 │ proxy (nginx) ─► frontend (SPA, nginx) │   │                                  │
                 │               ─► doc (SPA, nginx)      │   │                                  │
                 │               ─► backend (gunicorn) ───┼───┼─► db (PostgreSQL 17)             │
                 └────────────────────────────────────────┘   │   redis (rate limiting)          │
                                                              └──────────────────────────────────┘
```

| File                      | Role                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `docker-compose.yml`      | services, networks, health checks, volumes                                           |
| `.env.example`            | every setting (copy to `.env`)                                                       |
| `nginx/proxy.conf`        | public proxy: routing, rate limiting (`limit_req`), security headers, real client IP |
| `nginx/spa.conf.template` | static server for SPAs (cache, history fallback)                                     |
| `spa.Dockerfile`          | builds a workspace (`frontend` or `doc`) and serves it with unprivileged nginx       |
| `../backend/Dockerfile`   | Django + gunicorn image                                                              |

## Usage

```bash
cp deploy/.env.example deploy/.env          # set DJANGO_SECRET_KEY, POSTGRES_PASSWORD, PUBLIC_URL, EMAIL_URL…
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml --profile dev up -d --build    # + Mailpit on :8025
docker compose -f deploy/docker-compose.yml logs -f backend
docker compose -f deploy/docker-compose.yml down            # add -v to drop the database volume
```

- App: `http://localhost:8080` · Docs: `/doc/` · Admin: `/django-admin/` · E-mails (dev): `http://localhost:8025`
- Only `proxy` (and `mailpit` in dev) publish ports; PostgreSQL and Redis have no Internet access.
- HTTPS: terminate TLS in front of `proxy` (or add a 443 server), then `PUBLIC_URL=https://…` and `SECURE_COOKIES=true`.
- Several applications: give each one its own backend/front images and the same `DATABASE_URL`.

See the documentation app, page _Deployment_, for scaling, backups and single sign-on across sub-domains.
