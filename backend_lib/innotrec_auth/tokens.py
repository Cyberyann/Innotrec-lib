from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from innotrec_auth.models import User


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """Token invalidated as soon as the e-mail is verified."""

    key_salt: str = "innotrec_auth.tokens.EmailVerificationTokenGenerator"

    def _make_hash_value(self, user: User, timestamp: int) -> str:
        return f"{user.pk}{user.email}{user.email_verified}{timestamp}"


password_reset_token: PasswordResetTokenGenerator = PasswordResetTokenGenerator()
email_verification_token: EmailVerificationTokenGenerator = EmailVerificationTokenGenerator()


def encode_uid(user: User) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def decode_uid(uidb64: str) -> User | None:
    try:
        user_id: str = force_str(urlsafe_base64_decode(uidb64))
        return User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None
    except Exception:  # invalid UUID format raises ValidationError
        return None
