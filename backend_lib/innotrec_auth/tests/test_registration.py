import pytest
from django.core import mail
from django.core.mail import EmailMultiAlternatives
from rest_framework.test import APIClient

from innotrec_auth.models import User
from innotrec_auth.tests.conftest import PASSWORD, last_mail_link, uid_token_from_link

pytestmark = pytest.mark.django_db
URL: str = "/api/auth/register/"


def test_register_sends_verification_email(api: APIClient) -> None:
    res = api.post(URL, {"email": "New@Example.com", "password": PASSWORD, "first_name": "N"})
    assert res.status_code == 201, res.data
    assert res.data["email"] == "new@example.com"
    assert "password" not in res.data
    assert len(mail.outbox) == 1
    assert "confirm your e-mail" in mail.outbox[0].subject
    assert last_mail_link().startswith("http://front.test/verify-email/")
    message: EmailMultiAlternatives = mail.outbox[0]  # type: ignore[assignment]
    html: str = str(message.alternatives[0][0])
    assert "Confirm my e-mail" in html


def test_register_duplicate_email(api: APIClient, user: User) -> None:
    res = api.post(URL, {"email": "ALICE@example.com", "password": PASSWORD})
    assert res.status_code == 400
    assert "email" in res.data


def test_register_weak_password(api: APIClient) -> None:
    res = api.post(URL, {"email": "weak@example.com", "password": "123"})
    assert res.status_code == 400
    assert not User.objects.filter(email="weak@example.com").exists()


def test_registration_can_be_disabled(api: APIClient, settings: object) -> None:
    settings.INNOTREC_AUTH = {"ALLOW_REGISTRATION": False}  # type: ignore[attr-defined]
    res = api.post(URL, {"email": "x@example.com", "password": PASSWORD})
    assert res.status_code == 403
    assert res.data["code"] == "registration_disabled"


def test_verify_email(api: APIClient) -> None:
    api.post(URL, {"email": "v@example.com", "password": PASSWORD})
    payload = uid_token_from_link(last_mail_link())
    res = api.post("/api/auth/verify-email/", payload)
    assert res.status_code == 200
    assert User.objects.get(email="v@example.com").email_verified
    # token is single-use
    assert api.post("/api/auth/verify-email/", payload).status_code == 400


def test_verify_email_bad_token(api: APIClient, user: User) -> None:
    res = api.post("/api/auth/verify-email/", {"uid": "garbage", "token": "nope"})
    assert res.status_code == 400
    assert res.data["code"] == "invalid_token"


def test_resend_verification_does_not_leak(api: APIClient, make_user: object) -> None:
    make_user(email="unverified@example.com", email_verified=False)  # type: ignore[operator]
    ok = api.post("/api/auth/verify-email/resend/", {"email": "unverified@example.com"})
    unknown = api.post("/api/auth/verify-email/resend/", {"email": "ghost@example.com"})
    assert ok.status_code == unknown.status_code == 200
    assert ok.data == unknown.data
    assert len(mail.outbox) == 1
