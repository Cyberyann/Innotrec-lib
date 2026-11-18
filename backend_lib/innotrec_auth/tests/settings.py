"""Minimal settings used to test the library in isolation."""

from typing import Any

from innotrec_auth import presets

SECRET_KEY: str = "test-secret-key-not-for-production"
DEBUG: bool = False
ALLOWED_HOSTS: list[str] = ["testserver", "localhost"]
ROOT_URLCONF: str = "innotrec_auth.tests.urls"
INSTALLED_APPS: list[str] = presets.INSTALLED_APPS
MIDDLEWARE: list[str] = presets.MIDDLEWARE
AUTH_USER_MODEL: str = presets.AUTH_USER_MODEL
AUTH_PASSWORD_VALIDATORS: list[dict[str, Any]] = presets.AUTH_PASSWORD_VALIDATORS
REST_FRAMEWORK: dict[str, Any] = presets.rest_framework()
DATABASES: dict[str, dict[str, Any]] = {
    "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}
}
CACHES: dict[str, dict[str, Any]] = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}
TEMPLATES: list[dict[str, Any]] = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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
EMAIL_BACKEND: str = "django.core.mail.backends.locmem.EmailBackend"
DEFAULT_FROM_EMAIL: str = "noreply@example.com"
PASSWORD_HASHERS: list[str] = ["django.contrib.auth.hashers.MD5PasswordHasher"]
USE_TZ: bool = True
STATIC_URL: str = "/static/"
INNOTREC_AUTH: dict[str, Any] = {
    "APP_NAME": "TestApp",
    "FRONTEND_URL": "http://front.test",
    "ALLOWED_ORIGINS": ["http://front.test"],
}
globals().update(presets.security(debug=True, allowed_origins=["http://front.test"]))
