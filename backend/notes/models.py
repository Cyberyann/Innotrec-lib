from __future__ import annotations

from datetime import datetime
from typing import ClassVar

from django.conf import settings
from django.db import models
from innotrec_auth.models import User


class Category(models.TextChoices):
    WORK = "work", "Work"
    PERSONAL = "personal", "Personal"
    IDEA = "idea", "Idea"


class Note(models.Model):
    """Example business model owned by a shared user."""

    owner: models.ForeignKey[User, User] = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes"
    )
    title: models.CharField[str, str] = models.CharField(max_length=200)
    content: models.TextField[str, str] = models.TextField(blank=True)
    category: models.CharField[str, str] = models.CharField(
        max_length=20, choices=Category.choices, default=Category.WORK
    )
    created_at: models.DateTimeField[datetime, datetime] = models.DateTimeField(auto_now_add=True)
    updated_at: models.DateTimeField[datetime, datetime] = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return self.title
