"""Ready-to-use settings fragments for host projects.

Usage in ``settings.py``::

    from innotrec_auth import presets

    INSTALLED_APPS = [*presets.INSTALLED_APPS, "my_app"]
    MIDDLEWARE = presets.MIDDLEWARE
    REST_FRAMEWORK = presets.rest_framework()
    AUTH_USER_MODEL = presets.AUTH_USER_MODEL
    AUTH_PASSWORD_VALIDATORS = presets.AUTH_PASSWORD_VALIDATORS
    globals().update(presets.security(debug=DEBUG, allowed_origins=FRONTEND_ORIGINS))
"""

from typing import Any

AUTH_USER_MODEL: str = "innotrec_auth.User"

INSTALLED_APPS: list[str] = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "innotrec_auth",
]

MIDDLEWARE: list[str] = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "innotrec_auth.middleware.OriginCheckMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

AUTH_PASSWORD_VALIDATORS: list[dict[str, Any]] = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

DEFAULT_THROTTLE_RATES: dict[str, str] = {
    "burst": "20/second",
    "sustained": "2000/hour",
    "auth_login": "5/minute",
    "auth_2fa": "10/minute",
    "auth_register": "5/hour",
    "auth_password_reset": "5/hour",
    "auth_email_code": "5/hour",
    "auth_sensitive": "10/minute",
}


def rest_framework(
    throttle_rates: dict[str, str] | None = None, num_proxies: int | None = None
) -> dict[str, Any]:
    """DRF settings. ``num_proxies``: number of reverse proxies in front of Django (nginx = 1),
    so that rate limiting uses the real client IP from ``X-Forwarded-For``."""
    rates: dict[str, str] = {**DEFAULT_THROTTLE_RATES, **(throttle_rates or {})}
    return {
        "NUM_PROXIES": num_proxies,
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "rest_framework.authentication.SessionAuthentication",
        ],
        "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
        "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
        "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
        "DEFAULT_THROTTLE_CLASSES": [
            "innotrec_auth.throttling.BurstRateThrottle",
            "innotrec_auth.throttling.SustainedRateThrottle",
            "innotrec_auth.throttling.AuthScopedRateThrottle",
        ],
        "DEFAULT_THROTTLE_RATES": rates,
        "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
        "PAGE_SIZE": 25,
        "TEST_REQUEST_DEFAULT_FORMAT": "json",
    }


def security(
    debug: bool, allowed_origins: list[str], secure_cookies: bool | None = None
) -> dict[str, Any]:
    """Cookie / CSRF / CORS / HTTPS settings. ``secure_cookies`` defaults to ``not debug``."""
    secure: bool = (not debug) if secure_cookies is None else secure_cookies
    return {
        # Session cookie: HttpOnly, never readable from JS
        "SESSION_COOKIE_HTTPONLY": True,
        "SESSION_COOKIE_SAMESITE": "Lax",
        "SESSION_COOKIE_SECURE": secure,
        "SESSION_COOKIE_AGE": 60 * 60 * 12,
        # CSRF: cookie must be readable by the SPA to send the X-CSRFToken header
        "CSRF_COOKIE_HTTPONLY": False,
        "CSRF_COOKIE_SAMESITE": "Lax",
        "CSRF_COOKIE_SECURE": secure,
        "CSRF_TRUSTED_ORIGINS": allowed_origins,
        # CORS: only the known front-ends, with credentials
        "CORS_ALLOWED_ORIGINS": allowed_origins,
        "CORS_ALLOW_CREDENTIALS": True,
        # HTTPS hardening
        "SECURE_PROXY_SSL_HEADER": ("HTTP_X_FORWARDED_PROTO", "https"),
        "SECURE_CONTENT_TYPE_NOSNIFF": True,
        "SECURE_REFERRER_POLICY": "same-origin",
        "SECURE_HSTS_SECONDS": 0 if debug else 31536000,
        "SECURE_HSTS_INCLUDE_SUBDOMAINS": not debug,
        "X_FRAME_OPTIONS": "DENY",
    }
