import pyotp
import pytest
from django.core import mail
from rest_framework.test import APIClient

from innotrec_auth.models import User
from innotrec_auth.tests.conftest import PASSWORD, last_mail_code

pytestmark = pytest.mark.django_db
LOGIN: str = "/api/auth/login/"


def test_login_success_and_me(api: APIClient, user: User) -> None:
    res = api.post(LOGIN, {"email": "ALICE@example.com", "password": PASSWORD})
    assert res.status_code == 200
    assert res.data["status"] == "authenticated"
    assert res.data["user"]["email"] == user.email
    assert api.get("/api/auth/me/").status_code == 200


def test_login_invalid_credentials(api: APIClient, user: User) -> None:
    res = api.post(LOGIN, {"email": user.email, "password": "wrong"})
    assert res.status_code == 400
    assert res.data["code"] == "invalid_credentials"


def test_login_inactive_user(api: APIClient, make_user: object) -> None:
    make_user(email="off@example.com", is_active=False)  # type: ignore[operator]
    res = api.post(LOGIN, {"email": "off@example.com", "password": PASSWORD})
    assert res.data["code"] == "invalid_credentials"


def test_login_requires_verified_email(api: APIClient, make_user: object) -> None:
    make_user(email="nv@example.com", email_verified=False)  # type: ignore[operator]
    res = api.post(LOGIN, {"email": "nv@example.com", "password": PASSWORD})
    assert res.status_code == 403
    assert res.data["code"] == "email_not_verified"


def test_logout(api: APIClient, user: User) -> None:
    api.post(LOGIN, {"email": user.email, "password": PASSWORD})
    assert api.post("/api/auth/logout/").status_code == 204
    assert api.get("/api/auth/me/").status_code == 403


def test_me_requires_auth(api: APIClient) -> None:
    assert api.get("/api/auth/me/").status_code == 403


def test_login_with_totp(api: APIClient, make_user: object) -> None:
    secret: str = pyotp.random_base32()
    make_user(email="totp@example.com", two_factor_method="totp", totp_secret=secret)  # type: ignore[operator]
    res = api.post(LOGIN, {"email": "totp@example.com", "password": PASSWORD})
    assert res.data == {"status": "2fa_required", "method": "totp"}
    assert api.get("/api/auth/me/").status_code == 403  # not logged in yet

    bad = api.post("/api/auth/login/2fa/", {"code": "000000"})
    assert bad.status_code == 400 and bad.data["code"] == "invalid_code"

    ok = api.post("/api/auth/login/2fa/", {"code": pyotp.TOTP(secret).now()})
    assert ok.status_code == 200 and ok.data["status"] == "authenticated"
    assert api.get("/api/auth/me/").status_code == 200


def test_login_with_email_code(api: APIClient, make_user: object) -> None:
    make_user(email="mail2fa@example.com", two_factor_method="email")  # type: ignore[operator]
    res = api.post(LOGIN, {"email": "mail2fa@example.com", "password": PASSWORD})
    assert res.data == {"status": "2fa_required", "method": "email"}
    first_code: str = last_mail_code()

    assert api.post("/api/auth/login/2fa/resend/").status_code == 200
    new_code: str = last_mail_code()
    assert len(mail.outbox) == 2
    if first_code != new_code:  # previous code is invalidated by the resend
        assert api.post("/api/auth/login/2fa/", {"code": first_code}).status_code == 400

    ok = api.post("/api/auth/login/2fa/", {"code": new_code})
    assert ok.status_code == 200
    # a code can only be used once
    api.post("/api/auth/logout/")
    api.post(LOGIN, {"email": "mail2fa@example.com", "password": PASSWORD})
    assert api.post("/api/auth/login/2fa/", {"code": new_code}).status_code == 400


def test_email_code_max_attempts(api: APIClient, make_user: object, settings: object) -> None:
    settings.INNOTREC_AUTH = {"EMAIL_CODE_MAX_ATTEMPTS": 2}  # type: ignore[attr-defined]
    make_user(email="brute@example.com", two_factor_method="email")  # type: ignore[operator]
    api.post(LOGIN, {"email": "brute@example.com", "password": PASSWORD})
    code: str = last_mail_code()
    wrong: str = "999999" if code != "999999" else "111111"
    api.post("/api/auth/login/2fa/", {"code": wrong})
    api.post("/api/auth/login/2fa/", {"code": wrong})
    assert api.post("/api/auth/login/2fa/", {"code": code}).status_code == 400


def test_2fa_without_pending_login(api: APIClient) -> None:
    res = api.post("/api/auth/login/2fa/", {"code": "123456"})
    assert res.data["code"] == "no_pending_login"


def test_2fa_pending_login_expires(api: APIClient, make_user: object, settings: object) -> None:
    settings.INNOTREC_AUTH = {"TWO_FACTOR_PENDING_TTL_SECONDS": -1}  # type: ignore[attr-defined]
    secret: str = pyotp.random_base32()
    make_user(email="exp@example.com", two_factor_method="totp", totp_secret=secret)  # type: ignore[operator]
    api.post(LOGIN, {"email": "exp@example.com", "password": PASSWORD})
    res = api.post("/api/auth/login/2fa/", {"code": pyotp.TOTP(secret).now()})
    assert res.data["code"] == "no_pending_login"
