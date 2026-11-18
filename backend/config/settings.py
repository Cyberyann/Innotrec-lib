"""Sample application settings. Every environment-specific value comes from ``.env``."""

from pathlib import Path
from typing import Any

import environ
from innotrec_auth import presets

BASE_DIR: Path = Path(__file__).resolve().parent.parent

env: environ.Env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env", overwrite=False)

# --------------------------------------------------------------------------- core
SECRET_KEY: str = env.str("DJANGO_SECRET_KEY")
DEBUG: bool = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS: list[str] = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
FRONTEND_URL: str = env.str("FRONTEND_URL", default="http://localhost:5173")
FRONTEND_ORIGINS: list[str] = env.list("FRONTEND_ORIGINS", default=[FRONTEND_URL])

INSTALLED_APPS: list[str] = [*presets.INSTALLED_APPS, "notes"]
MIDDLEWARE: list[str] = [
    presets.MIDDLEWARE[0],
    "whitenoise.middleware.WhiteNoiseMiddleware",
    *presets.MIDDLEWARE[1:],
]
ROOT_URLCONF: str = "config.urls"
WSGI_APPLICATION: str = "config.wsgi.application"

TEMPLATES: list[dict[str, Any]] = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # override library e-mail templates here
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

# --------------------------------------------------------------------------- database
# Every application sharing users points to the SAME database (DATABASE_URL).
DATABASE_URL: str = env.str("DATABASE_URL", default="") or f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
DATABASES: dict[str, Any] = {"default": environ.Env.db_url_config(DATABASE_URL)}
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)
DEFAULT_AUTO_FIELD: str = "django.db.models.BigAutoField"

REDIS_URL: str = env.str("REDIS_URL", default="")
CACHES: dict[str, Any] = {
    "default": (
        {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}
        if REDIS_URL
        else {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
    )
}

# --------------------------------------------------------------------------- auth library
AUTH_USER_MODEL: str = presets.AUTH_USER_MODEL
AUTH_PASSWORD_VALIDATORS: list[dict[str, Any]] = presets.AUTH_PASSWORD_VALIDATORS
REST_FRAMEWORK: dict[str, Any] = presets.rest_framework(
    {
        "burst": env.str("THROTTLE_BURST", default="20/second"),
        "sustained": env.str("THROTTLE_SUSTAINED", default="2000/hour"),
    },
    num_proxies=env.int("NUM_PROXIES", default=0) or None,
)
INNOTREC_AUTH: dict[str, Any] = {
    "APP_NAME": env.str("APP_NAME", default="Innotrec Sample"),
    "FRONTEND_URL": FRONTEND_URL,
    "ALLOWED_ORIGINS": FRONTEND_ORIGINS,
    "SUPPORT_EMAIL": env.str("SUPPORT_EMAIL", default=""),
    "TOTP_ISSUER": env.str("APP_NAME", default="Innotrec Sample"),
    "REQUIRE_EMAIL_VERIFICATION": env.bool("REQUIRE_EMAIL_VERIFICATION", default=True),
    "ALLOW_REGISTRATION": env.bool("ALLOW_REGISTRATION", default=True),
}
globals().update(
    presets.security(
        debug=DEBUG,
        allowed_origins=FRONTEND_ORIGINS,
        secure_cookies=env.bool("SECURE_COOKIES", default=not DEBUG),
    )
)
SESSION_COOKIE_DOMAIN: str | None = env.str("SESSION_COOKIE_DOMAIN", default=None)
CSRF_COOKIE_DOMAIN: str | None = env.str("CSRF_COOKIE_DOMAIN", default=None)

# --------------------------------------------------------------------------- e-mail
# smtp://user:password@smtp.example.com:587 (+tls) — or consolemail:// in development
EMAIL_CONFIG: dict[str, Any] = env.email_url("EMAIL_URL", default="consolemail://")
globals().update(EMAIL_CONFIG)
DEFAULT_FROM_EMAIL: str = env.str("DEFAULT_FROM_EMAIL", default="noreply@localhost")

# --------------------------------------------------------------------------- i18n / static
LANGUAGE_CODE: str = "en-us"
TIME_ZONE: str = env.str("TIME_ZONE", default="Europe/Paris")
USE_I18N: bool = True
USE_TZ: bool = True
STATIC_URL: str = "/django-static/"
STATIC_ROOT: Path = BASE_DIR / "staticfiles"
STORAGES: dict[str, dict[str, str]] = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

LOGGING: dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": env.str("LOG_LEVEL", default="INFO")},
}
