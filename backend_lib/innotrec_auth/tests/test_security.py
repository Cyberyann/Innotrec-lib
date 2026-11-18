import pytest
from rest_framework.test import APIClient

from innotrec_auth import presets
from innotrec_auth.models import User
from innotrec_auth.tests.conftest import PASSWORD
from innotrec_auth.throttling import BurstRateThrottle

pytestmark = pytest.mark.django_db


def test_login_is_rate_limited(api: APIClient, user: User) -> None:
    codes: list[int] = [
        api.post("/api/auth/login/", {"email": user.email, "password": "bad"}).status_code
        for _ in range(6)
    ]
    assert codes[:5] == [400] * 5
    assert codes[5] == 429


def test_burst_rate_limit(api: APIClient, monkeypatch: pytest.MonkeyPatch) -> None:
    rates: dict[str, str] = {**presets.DEFAULT_THROTTLE_RATES, "burst": "3/second"}
    monkeypatch.setattr(BurstRateThrottle, "THROTTLE_RATES", rates)
    statuses: list[int] = [api.get("/api/auth/csrf/").status_code for _ in range(4)]
    assert statuses == [200, 200, 200, 429]
    assert "Retry-After" in api.get("/api/auth/csrf/")


def test_origin_check_rejects_unknown_origin(api: APIClient) -> None:
    res = api.get("/api/auth/csrf/", HTTP_ORIGIN="https://evil.example")
    assert res.status_code == 403


def test_origin_check_rejects_cross_site_without_origin(api: APIClient) -> None:
    res = api.get("/api/auth/csrf/", HTTP_SEC_FETCH_SITE="cross-site")
    assert res.status_code == 403


def test_origin_check_rejects_unknown_referer(api: APIClient) -> None:
    res = api.get("/api/auth/csrf/", HTTP_REFERER="https://evil.example/page")
    assert res.status_code == 403


def test_origin_check_accepts_frontend(api: APIClient) -> None:
    res = api.get("/api/auth/csrf/", HTTP_ORIGIN="http://front.test")
    assert res.status_code == 200
    assert res["Access-Control-Allow-Origin"] == "http://front.test"
    assert res["Access-Control-Allow-Credentials"] == "true"


def test_csrf_cookie_and_enforcement(user: User) -> None:
    client: APIClient = APIClient(enforce_csrf_checks=True)
    rejected = client.post("/api/auth/login/", {"email": user.email, "password": PASSWORD})
    assert rejected.status_code == 403  # no CSRF token

    token: str = client.get("/api/auth/csrf/").data["csrfToken"]
    assert "csrftoken" in client.cookies
    accepted = client.post(
        "/api/auth/login/",
        {"email": user.email, "password": PASSWORD},
        HTTP_X_CSRFTOKEN=token,
    )
    assert accepted.status_code == 200
    # authenticated unsafe calls also need the (rotated) token
    assert client.post("/api/auth/logout/").status_code == 403
    rotated: str = client.cookies["csrftoken"].value
    assert client.post("/api/auth/logout/", HTTP_X_CSRFTOKEN=rotated).status_code == 204


def test_session_cookie_is_httponly(api: APIClient, user: User) -> None:
    res = api.post("/api/auth/login/", {"email": user.email, "password": PASSWORD})
    assert res.cookies["sessionid"]["httponly"]


def test_security_preset_production_values() -> None:
    prod = presets.security(debug=False, allowed_origins=["https://app.example.com"])
    assert prod["SESSION_COOKIE_SECURE"] and prod["CSRF_COOKIE_SECURE"]
    assert prod["SECURE_HSTS_SECONDS"] > 0
    assert prod["CORS_ALLOWED_ORIGINS"] == ["https://app.example.com"]
