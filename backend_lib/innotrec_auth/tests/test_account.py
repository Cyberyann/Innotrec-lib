import pyotp
import pytest
from django.core import mail
from rest_framework.test import APIClient

from innotrec_auth.models import User
from innotrec_auth.tests.conftest import (
    PASSWORD,
    last_mail_code,
    last_mail_link,
    uid_token_from_link,
)

pytestmark = pytest.mark.django_db
NEW_PASSWORD: str = "An0ther-Str0ng-Pass"


def test_update_profile_ignores_protected_fields(logged_api: APIClient, user: User) -> None:
    res = logged_api.patch(
        "/api/auth/me/",
        {"first_name": "Alicia", "is_staff": True, "email": "hack@example.com"},
        format="json",
    )
    assert res.status_code == 200
    user.refresh_from_db()
    assert user.first_name == "Alicia"
    assert not user.is_staff
    assert user.email == "alice@example.com"


def test_delete_account_requires_password(logged_api: APIClient, user: User) -> None:
    res = logged_api.delete("/api/auth/me/", {"password": "wrong"}, format="json")
    assert res.status_code == 400
    res = logged_api.delete("/api/auth/me/", {"password": PASSWORD}, format="json")
    assert res.status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()


def test_change_password(api: APIClient, user: User) -> None:
    api.post("/api/auth/login/", {"email": user.email, "password": PASSWORD})
    bad = api.post(
        "/api/auth/password/change/",
        {"current_password": "nope", "new_password": NEW_PASSWORD},
    )
    assert bad.status_code == 400 and "current_password" in bad.data
    ok = api.post(
        "/api/auth/password/change/",
        {"current_password": PASSWORD, "new_password": NEW_PASSWORD},
    )
    assert ok.status_code == 200
    assert api.get("/api/auth/me/").status_code == 200  # session kept
    user.refresh_from_db()
    assert user.check_password(NEW_PASSWORD)
    assert "password was changed" in mail.outbox[-1].subject


def test_password_reset_flow(api: APIClient, user: User) -> None:
    known = api.post("/api/auth/password/reset/", {"email": user.email})
    unknown = api.post("/api/auth/password/reset/", {"email": "nobody@example.com"})
    assert known.status_code == unknown.status_code == 200
    assert known.data == unknown.data  # no user enumeration
    assert len(mail.outbox) == 1

    payload: dict[str, str] = uid_token_from_link(last_mail_link())
    weak = api.post("/api/auth/password/reset/confirm/", {**payload, "new_password": "123"})
    assert weak.status_code == 400
    ok = api.post("/api/auth/password/reset/confirm/", {**payload, "new_password": NEW_PASSWORD})
    assert ok.status_code == 200
    user.refresh_from_db()
    assert user.check_password(NEW_PASSWORD)
    # token cannot be reused once the password changed
    again = api.post("/api/auth/password/reset/confirm/", {**payload, "new_password": PASSWORD})
    assert again.status_code == 400


def test_totp_setup(logged_api: APIClient, user: User) -> None:
    assert logged_api.post("/api/auth/2fa/totp/confirm/", {"code": "123456"}).data["code"] == (
        "no_pending_setup"
    )
    setup = logged_api.post("/api/auth/2fa/totp/setup/")
    assert setup.status_code == 200
    assert setup.data["otpauth_url"].startswith("otpauth://totp/")
    assert setup.data["qr_code"].startswith("data:image/svg+xml;base64,")
    secret: str = setup.data["secret"]
    assert logged_api.post("/api/auth/2fa/totp/confirm/", {"code": "000000"}).status_code == 400
    ok = logged_api.post("/api/auth/2fa/totp/confirm/", {"code": pyotp.TOTP(secret).now()})
    assert ok.status_code == 200 and ok.data["two_factor_method"] == "totp"
    user.refresh_from_db()
    assert user.totp_secret == secret


def test_email_2fa_setup_and_disable(logged_api: APIClient, user: User) -> None:
    assert logged_api.post("/api/auth/2fa/email/setup/").status_code == 200
    code: str = last_mail_code()
    ok = logged_api.post("/api/auth/2fa/email/confirm/", {"code": code})
    assert ok.status_code == 200 and ok.data["two_factor_method"] == "email"

    bad = logged_api.post("/api/auth/2fa/disable/", {"password": "wrong"})
    assert bad.status_code == 400
    off = logged_api.post("/api/auth/2fa/disable/", {"password": PASSWORD})
    assert off.data["two_factor_method"] == "none"
