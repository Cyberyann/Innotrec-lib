"""Business logic shared by the API views (kept out of views to be reusable)."""

import base64
import hashlib
import hmac
import io
import secrets
from typing import Any

import pyotp
import qrcode
import qrcode.image.svg
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from innotrec_auth.conf import AuthSettings, get_auth_settings
from innotrec_auth.emails import send_templated_mail
from innotrec_auth.models import EmailCode, EmailCodePurpose, User
from innotrec_auth.tokens import email_verification_token, encode_uid, password_reset_token


# --------------------------------------------------------------------------- e-mail codes
def _hash_code(code: str) -> str:
    key: bytes = settings.SECRET_KEY.encode()
    return hmac.new(key, code.encode(), hashlib.sha256).hexdigest()


def issue_email_code(user: User, purpose: str) -> str:
    """Invalidate previous codes for this purpose, create a new one and e-mail it."""
    conf: AuthSettings = get_auth_settings()
    code: str = "".join(secrets.choice("0123456789") for _ in range(conf.EMAIL_CODE_LENGTH))
    with transaction.atomic():
        EmailCode.objects.filter(user=user, purpose=purpose, consumed_at__isnull=True).update(
            consumed_at=timezone.now()
        )
        EmailCode.objects.create(
            user=user,
            purpose=purpose,
            code_hash=_hash_code(code),
            expires_at=EmailCode.default_expiry(conf.EMAIL_CODE_TTL_SECONDS),
        )
    send_templated_mail(
        "two_factor_code",
        [user.email],
        {
            "user": user,
            "code": code,
            "ttl_minutes": conf.EMAIL_CODE_TTL_SECONDS // 60,
            "purpose": purpose,
        },
    )
    return code


def verify_email_code(user: User, purpose: str, code: str) -> bool:
    conf: AuthSettings = get_auth_settings()
    with transaction.atomic():
        entry: EmailCode | None = (
            EmailCode.objects.select_for_update()
            .filter(user=user, purpose=purpose, consumed_at__isnull=True)
            .order_by("-created_at")
            .first()
        )
        if entry is None or not entry.is_usable:
            return False
        if entry.attempts >= conf.EMAIL_CODE_MAX_ATTEMPTS:
            entry.consumed_at = timezone.now()
            entry.save(update_fields=["consumed_at"])
            return False
        valid: bool = hmac.compare_digest(entry.code_hash, _hash_code(code.strip()))
        entry.attempts += 1
        if valid:
            entry.consumed_at = timezone.now()
        entry.save(update_fields=["attempts", "consumed_at"])
        return valid


# --------------------------------------------------------------------------- TOTP
def new_totp_secret() -> str:
    return pyotp.random_base32()


def totp_provisioning(user: User, secret: str) -> dict[str, str]:
    conf: AuthSettings = get_auth_settings()
    uri: str = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=conf.TOTP_ISSUER)
    image: Any = qrcode.make(uri, image_factory=qrcode.image.svg.SvgPathImage)
    buffer: io.BytesIO = io.BytesIO()
    image.save(buffer)
    svg_b64: str = base64.b64encode(buffer.getvalue()).decode()
    return {
        "secret": secret,
        "otpauth_url": uri,
        "qr_code": f"data:image/svg+xml;base64,{svg_b64}",
    }


def verify_totp(secret: str, code: str) -> bool:
    if not secret:
        return False
    conf: AuthSettings = get_auth_settings()
    return bool(pyotp.TOTP(secret).verify(code.strip(), valid_window=conf.TOTP_VALID_WINDOW))


def verify_second_factor(user: User, code: str) -> bool:
    if user.two_factor_method == "totp":
        return verify_totp(user.totp_secret, code)
    if user.two_factor_method == "email":
        return verify_email_code(user, EmailCodePurpose.LOGIN, code)
    return False


# --------------------------------------------------------------------------- mails
def send_verification_email(user: User) -> None:
    conf: AuthSettings = get_auth_settings()
    link: str = conf.frontend_link(
        conf.VERIFY_EMAIL_PATH,
        uid=encode_uid(user),
        token=email_verification_token.make_token(user),
    )
    send_templated_mail("verify_email", [user.email], {"user": user, "link": link})


def send_password_reset_email(user: User) -> None:
    conf: AuthSettings = get_auth_settings()
    link: str = conf.frontend_link(
        conf.PASSWORD_RESET_PATH, uid=encode_uid(user), token=password_reset_token.make_token(user)
    )
    send_templated_mail("password_reset", [user.email], {"user": user, "link": link})


def send_password_changed_email(user: User) -> None:
    if get_auth_settings().SEND_PASSWORD_CHANGED_EMAIL:
        send_templated_mail("password_changed", [user.email], {"user": user})


def send_welcome_email(user: User) -> None:
    if get_auth_settings().SEND_WELCOME_EMAIL:
        send_templated_mail("welcome", [user.email], {"user": user})
