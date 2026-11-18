# Sample backend (Django)

Example Django project showing how an application uses **innotrec-auth**:

- `config/settings.py`: everything comes from `.env` (django-environ) + `innotrec_auth.presets`
- `config/urls.py`: `/api/auth/` (library), `/api/notes/` (app), `/api/health/`, `/django-admin/`
- `notes/`: a small business app — notes owned by the shared user, with a `stats` endpoint feeding the dashboard chart

## Run locally

```bash
pip install -r requirements-dev.txt     # from this folder; installs ../backend_lib in editable mode
cp .env.example .env                    # empty DATABASE_URL = sqlite file
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver              # http://localhost:8000
```

To use PostgreSQL locally: `docker run -d -p 5432:5432 -e POSTGRES_USER=innotrec -e POSTGRES_PASSWORD=innotrec postgres:17-alpine`
and set `DATABASE_URL=postgres://innotrec:innotrec@localhost:5432/innotrec`.

## Tests & checks

```bash
pytest
black --check . && ruff check . && mypy .
```

## Docker

`Dockerfile` (build context = repository root) installs the library from `../backend_lib`, runs as a non-root user, applies
migrations at start-up (`RUN_MIGRATIONS=true`), creates the first admin from `DJANGO_SUPERUSER_EMAIL/PASSWORD` and starts
gunicorn. In another repository, replace the `COPY backend_lib` step with the pinned requirement
`innotrec-auth @ git+https://github.com/innotrec/innotrec-lib.git@backend-vX.Y.Z#subdirectory=backend_lib`.

Environment variables: see [`.env.example`](.env.example).
