"""End-to-end API scenario: a real browser-like client (CSRF enforced, cookies kept)."""

from typing import Any

import pytest
from django.core import mail
from rest_framework.response import Response
from rest_framework.test import APIClient

from innotrec_auth.models import User
from innotrec_auth.tests.conftest import last_mail_code, last_mail_link, uid_token_from_link

pytestmark = [pytest.mark.django_db, pytest.mark.e2e]
ORIGIN: str = "http://front.test"


class Browser:
    """Mimics the front-end library: fetch CSRF cookie, send X-CSRFToken + Origin."""

    def __init__(self) -> None:
        self.client: APIClient = APIClient(enforce_csrf_checks=True)
        self.client.get("/api/auth/csrf/", HTTP_ORIGIN=ORIGIN)

    def _headers(self) -> dict[str, str]:
        return {"HTTP_X_CSRFTOKEN": self.client.cookies["csrftoken"].value, "HTTP_ORIGIN": ORIGIN}

    def get(self, url: str) -> Response:
        return self.client.get(url, HTTP_ORIGIN=ORIGIN)

    def post(self, url: str, data: dict[str, Any] | None = None) -> Response:
        headers: dict[str, Any] = self._headers()
        return self.client.post(url, data or {}, format="json", **headers)

    def delete(self, url: str, data: dict[str, Any]) -> Response:
        headers: dict[str, Any] = self._headers()
        return self.client.delete(url, data, format="json", **headers)


def test_full_user_journey() -> None:
    browser: Browser = Browser()
    email: str = "journey@example.com"
    password: str = "Journey-Passw0rd!"

    # 1. register + e-mail verification
    assert (
        browser.post("/api/auth/register/", {"email": email, "password": password}).status_code
        == 201
    )
    assert (
        browser.post("/api/auth/login/", {"email": email, "password": password}).status_code == 403
    )
    verify = browser.post("/api/auth/verify-email/", uid_token_from_link(last_mail_link()))
    assert verify.status_code == 200

    # 2. login without 2FA
    login = browser.post("/api/auth/login/", {"email": email, "password": password})
    assert login.data["status"] == "authenticated"

    # 3. enable e-mail 2FA
    assert browser.post("/api/auth/2fa/email/setup/").status_code == 200
    assert (
        browser.post("/api/auth/2fa/email/confirm/", {"code": last_mail_code()}).status_code == 200
    )
    assert browser.post("/api/auth/logout/").status_code == 204
    assert browser.get("/api/auth/me/").status_code == 403

    # 4. login with e-mail code
    challenge = browser.post("/api/auth/login/", {"email": email, "password": password})
    assert challenge.data == {"status": "2fa_required", "method": "email"}
    second = browser.post("/api/auth/login/2fa/", {"code": last_mail_code()})
    assert second.data["status"] == "authenticated"
    assert browser.get("/api/auth/me/").data["two_factor_method"] == "email"

    # 5. forgotten password from another browser
    other: Browser = Browser()
    assert other.post("/api/auth/password/reset/", {"email": email}).status_code == 200
    new_password: str = "Brand-New-Passw0rd!"
    reset = other.post(
        "/api/auth/password/reset/confirm/",
        {**uid_token_from_link(last_mail_link()), "new_password": new_password},
    )
    assert reset.status_code == 200
    # the password change invalidated every other open session
    assert browser.get("/api/auth/me/").status_code == 403

    # 6. log in again (password + e-mail code) and delete the account
    browser.post("/api/auth/login/", {"email": email, "password": new_password})
    assert browser.post("/api/auth/login/2fa/", {"code": last_mail_code()}).status_code == 200
    assert browser.delete("/api/auth/me/", {"password": new_password}).status_code == 204
    assert not User.objects.filter(email=email).exists()
    assert len(mail.outbox) >= 6
