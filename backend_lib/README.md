# innotrec-auth (backend library)

Reusable Django REST Framework app that manages **users and authentication** for every Innotrec application.

- Shared user model `innotrec_auth.User` (UUID, login by e-mail, `email_verified`, `two_factor_method`)
- Register, verify e-mail, login, logout, profile, delete account
- Two-factor authentication: authenticator app (TOTP + QR code) or 6-digit e-mail code
- Password change, forgotten password (reset link), password-changed notification
- Staff API: list / search / create / update / delete users
- CSRF for SPA (session cookie HttpOnly, CSRF cookie + header), CORS and origin allow-list middleware
- Rate limiting: burst (per second), sustained (per hour) and strict scoped limits on sensitive endpoints
- HTML + text e-mail templates, overridable per application
- `presets` module: secure settings in a few lines

## Install

```bash
# in an application (pin a released tag)
pip install "innotrec-auth @ git+https://github.com/innotrec/innotrec-lib.git@backend-v1.0.0#subdirectory=backend_lib"

# in this monorepo, with dev tools
pip install -e ".[dev]"
```

## Configure

```python
# settings.py
from innotrec_auth import presets

INSTALLED_APPS = [*presets.INSTALLED_APPS, "my_app"]
MIDDLEWARE = presets.MIDDLEWARE
AUTH_USER_MODEL = presets.AUTH_USER_MODEL                 # "innotrec_auth.User"
AUTH_PASSWORD_VALIDATORS = presets.AUTH_PASSWORD_VALIDATORS
REST_FRAMEWORK = presets.rest_framework(num_proxies=1)    # 1 = behind nginx
INNOTREC_AUTH = {
    "APP_NAME": "My application",
    "FRONTEND_URL": "https://app.example.com",
    "ALLOWED_ORIGINS": ["https://app.example.com"],
}
globals().update(presets.security(debug=DEBUG, allowed_origins=["https://app.example.com"]))

# urls.py
urlpatterns = [path("api/auth/", include("innotrec_auth.urls"))]
```

Then `python manage.py migrate`. Use a shared cache (Redis) in production so that throttling counters are shared between workers.

## Endpoints (`/api/auth/`)

`csrf/` · `register/` · `verify-email/` · `verify-email/resend/` · `login/` · `login/2fa/` · `login/2fa/resend/` · `logout/` ·
`me/` (GET/PATCH/DELETE) · `password/change/` · `password/reset/` · `password/reset/confirm/` · `2fa/totp/setup/` ·
`2fa/totp/confirm/` · `2fa/email/setup/` · `2fa/email/confirm/` · `2fa/disable/` · `users/` (staff CRUD).

The full reference (payloads, error codes, every `INNOTREC_AUTH` setting) is in the documentation app (`doc/` → _Backend library_).

## E-mail templates

`templates/innotrec_auth/email/<name>.{subject.txt,txt,html}` for `verify_email`, `password_reset`, `password_changed`,
`two_factor_code`, `welcome`. Override one by creating the same path in your project `templates/` directory.

## Development

```bash
pytest                         # unit + API + e2e journey (innotrec_auth/tests)
pytest --cov=innotrec_auth
black . && ruff check --fix .
mypy innotrec_auth             # strict
DJANGO_SETTINGS_MODULE=innotrec_auth.tests.settings django-admin makemigrations innotrec_auth
```

Rules: every variable is type-annotated, `mypy --strict` passes, migrations are additive within a major version, every change
is listed in [`CHANGELOG.md`](CHANGELOG.md). Release with `../scripts/release.sh backend patch|minor|major`.
