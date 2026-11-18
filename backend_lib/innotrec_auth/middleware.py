"""Only accept API calls coming from the known front-end origins.

Browsers always send ``Origin`` on cross-origin requests and on any non-GET request,
and ``Sec-Fetch-Site`` on every request. Requests whose origin is not in
``INNOTREC_AUTH["ALLOWED_ORIGINS"]`` (or the API's own host) are rejected with 403.
This complements (does not replace) CORS, CSRF, and network isolation in docker-compose.
"""

from collections.abc import Callable
from urllib.parse import urlsplit

from django.http import HttpRequest, HttpResponse, JsonResponse

from innotrec_auth.conf import AuthSettings, get_auth_settings


class OriginCheckMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response: Callable[[HttpRequest], HttpResponse] = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        conf: AuthSettings = get_auth_settings()
        if conf.ENFORCE_ORIGIN_CHECK and request.path.startswith(conf.API_PREFIX):
            if not self._is_allowed(request, conf):
                return JsonResponse({"detail": "Origin not allowed."}, status=403)
        return self.get_response(request)

    @staticmethod
    def _is_allowed(request: HttpRequest, conf: AuthSettings) -> bool:
        origin: str | None = request.headers.get("Origin")
        if origin is None:
            referer: str | None = request.headers.get("Referer")
            if referer:
                parts = urlsplit(referer)
                origin = f"{parts.scheme}://{parts.netloc}"
        fetch_site: str | None = request.headers.get("Sec-Fetch-Site")
        if origin is None:
            # Non-browser client (server-to-server, curl, tests) or same-origin GET.
            return fetch_site in (None, "same-origin", "none")
        allowed: set[str] = {o.rstrip("/") for o in conf.ALLOWED_ORIGINS}
        own_origin: str = f"{request.scheme}://{request.get_host()}"
        return origin.rstrip("/") in allowed or origin.rstrip("/") == own_origin
