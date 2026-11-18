import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from innotrec_auth.models import User

pytestmark = pytest.mark.django_db


def test_ensure_superuser_is_idempotent(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "Root@Example.com")
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", "Very-Long-Passw0rd")
    call_command("ensure_superuser")
    call_command("ensure_superuser")
    admin = User.objects.get(email="root@example.com")
    assert admin.is_superuser and admin.check_password("Very-Long-Passw0rd")
    assert User.objects.count() == 1


def test_ensure_superuser_requires_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DJANGO_SUPERUSER_EMAIL", raising=False)
    with pytest.raises(CommandError):
        call_command("ensure_superuser")
