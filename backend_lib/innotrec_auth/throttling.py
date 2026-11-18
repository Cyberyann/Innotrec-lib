"""Rate limiting.

* ``BurstRateThrottle``      – per second limit for every API call (user id or client IP)
* ``SustainedRateThrottle``  – per hour limit for every API call
* ``ScopedRateThrottle``     – stricter limits on sensitive endpoints (login, 2FA, reset...)

Rates are configured in ``REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]`` (see ``presets``).
Throttling state is kept in the Django cache: use a shared cache (Redis) in production
so that every worker / container sees the same counters.
"""

from typing import TYPE_CHECKING

from rest_framework.throttling import ScopedRateThrottle, SimpleRateThrottle

if TYPE_CHECKING:  # avoid a circular import: DRF imports throttles while building APIView
    from rest_framework.request import Request
    from rest_framework.views import APIView


class _UserOrIpThrottle(SimpleRateThrottle):
    def get_cache_key(self, request: "Request", view: "APIView") -> str | None:
        ident: str
        if request.user is not None and request.user.is_authenticated:
            ident = str(request.user.pk)
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class BurstRateThrottle(_UserOrIpThrottle):
    scope: str = "burst"


class SustainedRateThrottle(_UserOrIpThrottle):
    scope: str = "sustained"


class AuthScopedRateThrottle(ScopedRateThrottle):
    """Scoped throttle always keyed by client IP (sensitive endpoints are mostly anonymous)."""

    def get_cache_key(self, request: "Request", view: "APIView") -> str | None:
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}
