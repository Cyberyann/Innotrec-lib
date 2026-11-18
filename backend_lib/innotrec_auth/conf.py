"""Library settings.

Every value can be overridden in the host project's ``settings.py``::

    INNOTREC_AUTH = {
        "APP_NAME": "My application",
        "FRONTEND_URL": "https://app.example.com",
    }
"""

from dataclasses import dataclass, field, fields
from typing import Any

from django.conf import settings


@dataclass(frozen=True)
class AuthSettings:
    APP_NAME: str = "Innotrec"
    FRONTEND_URL: str = "http://localhost:5173"
    PASSWORD_RESET_PATH: str = "/reset-password/{uid}/{token}"
    VERIFY_EMAIL_PATH: str = "/verify-email/{uid}/{token}"
    ALLOW_REGISTRATION: bool = True
    REQUIRE_EMAIL_VERIFICATION: bool = True
    SEND_WELCOME_EMAIL: bool = True
    SEND_PASSWORD_CHANGED_EMAIL: bool = True
    SUPPORT_EMAIL: str = ""
    EMAIL_CODE_LENGTH: int = 6
    EMAIL_CODE_TTL_SECONDS: int = 600
    EMAIL_CODE_MAX_ATTEMPTS: int = 5
    TWO_FACTOR_PENDING_TTL_SECONDS: int = 300
    TOTP_ISSUER: str = "Innotrec"
    TOTP_VALID_WINDOW: int = 1
    API_PREFIX: str = "/api/"
    ALLOWED_ORIGINS: list[str] = field(default_factory=list)
    ENFORCE_ORIGIN_CHECK: bool = True

    def frontend_link(self, path_template: str, **kwargs: str) -> str:
        path: str = path_template.format(**kwargs)
        return f"{self.FRONTEND_URL.rstrip('/')}{path}"


def get_auth_settings() -> AuthSettings:
    """Return current settings (read on each call so ``override_settings`` works in tests)."""
    user_values: dict[str, Any] = dict(getattr(settings, "INNOTREC_AUTH", {}))
    known: set[str] = {f.name for f in fields(AuthSettings)}
    unknown: set[str] = set(user_values) - known
    if unknown:
        raise ValueError(f"Unknown INNOTREC_AUTH settings: {', '.join(sorted(unknown))}")
    return AuthSettings(**user_values)
