from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import ClassVar

from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone

from innotrec_auth.managers import UserManager


class TwoFactorMethod(models.TextChoices):
    NONE = "none", "Disabled"
    TOTP = "totp", "Authenticator application (TOTP)"
    EMAIL = "email", "Code sent by e-mail"


class User(AbstractBaseUser, PermissionsMixin):
    """Shared user model. Every application must set ``AUTH_USER_MODEL = "innotrec_auth.User"``."""

    id: models.UUIDField[uuid.UUID, uuid.UUID] = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    email: models.EmailField[str, str] = models.EmailField("email address", unique=True)
    first_name: models.CharField[str, str] = models.CharField(max_length=150, blank=True)
    last_name: models.CharField[str, str] = models.CharField(max_length=150, blank=True)
    is_active: models.BooleanField[bool, bool] = models.BooleanField(default=True)
    is_staff: models.BooleanField[bool, bool] = models.BooleanField(default=False)
    email_verified: models.BooleanField[bool, bool] = models.BooleanField(default=False)
    two_factor_method: models.CharField[str, str] = models.CharField(
        max_length=10, choices=TwoFactorMethod.choices, default=TwoFactorMethod.NONE
    )
    totp_secret: models.CharField[str, str] = models.CharField(max_length=64, blank=True)
    date_joined: models.DateTimeField[datetime, datetime] = models.DateTimeField(
        default=timezone.now
    )
    updated_at: models.DateTimeField[datetime, datetime] = models.DateTimeField(auto_now=True)

    objects: UserManager = UserManager()

    USERNAME_FIELD: str = "email"
    EMAIL_FIELD: str = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    class Meta:
        ordering: ClassVar[list[str]] = ["email"]
        verbose_name: ClassVar[str] = "user"
        verbose_name_plural: ClassVar[str] = "users"

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def two_factor_enabled(self) -> bool:
        return self.two_factor_method != TwoFactorMethod.NONE


class EmailCodePurpose(models.TextChoices):
    LOGIN = "login", "Login second factor"
    ENABLE_2FA = "enable_2fa", "Enable e-mail second factor"


class EmailCode(models.Model):
    """One-time numeric code sent by e-mail. Only a hash of the code is stored."""

    user: models.ForeignKey[User, User] = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="email_codes"
    )
    purpose: models.CharField[str, str] = models.CharField(
        max_length=20, choices=EmailCodePurpose.choices
    )
    code_hash: models.CharField[str, str] = models.CharField(max_length=128)
    created_at: models.DateTimeField[datetime, datetime] = models.DateTimeField(auto_now_add=True)
    expires_at: models.DateTimeField[datetime, datetime] = models.DateTimeField()
    attempts: models.PositiveSmallIntegerField[int, int] = models.PositiveSmallIntegerField(
        default=0
    )
    consumed_at: models.DateTimeField[datetime | None, datetime | None] = models.DateTimeField(
        null=True, blank=True
    )

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=["user", "purpose", "-created_at"])
        ]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.purpose}"

    @property
    def is_usable(self) -> bool:
        return self.consumed_at is None and self.expires_at > timezone.now()

    @staticmethod
    def default_expiry(seconds: int) -> datetime:
        return timezone.now() + timedelta(seconds=seconds)
