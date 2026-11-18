"""Create the first admin from DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD (idempotent)."""

import os
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from innotrec_auth.models import User


class Command(BaseCommand):
    help: str = "Create a superuser from environment variables if it does not exist yet."

    def handle(self, *args: Any, **options: Any) -> None:
        email: str = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip().lower()
        password: str = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")
        if not email or not password:
            raise CommandError("DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD are required.")
        if User.objects.filter(email__iexact=email).exists():
            self.stdout.write(f"Superuser {email} already exists.")
            return
        User.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} created."))
