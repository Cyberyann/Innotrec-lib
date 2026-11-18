import pytest

from innotrec_auth.conf import get_auth_settings
from innotrec_auth.models import User

pytestmark = pytest.mark.django_db


def test_create_user_normalizes_email() -> None:
    user = User.objects.create_user("Bob@Example.COM", "x" * 12)
    assert user.email == "bob@example.com"
    assert user.check_password("x" * 12)
    assert not user.is_staff and not user.email_verified


def test_create_user_without_password_is_unusable() -> None:
    assert not User.objects.create_user("sso@example.com").has_usable_password()


def test_create_user_requires_email() -> None:
    with pytest.raises(ValueError):
        User.objects.create_user("")


def test_create_superuser() -> None:
    admin = User.objects.create_superuser("root@example.com", "x" * 12)
    assert admin.is_staff and admin.is_superuser and admin.email_verified


def test_full_name_and_two_factor_flag() -> None:
    user = User(email="a@b.c", first_name="Ada", last_name="Lovelace", two_factor_method="email")
    assert user.full_name == "Ada Lovelace"
    assert user.two_factor_enabled
    assert str(user) == "a@b.c"


def test_get_by_natural_key_is_case_insensitive() -> None:
    User.objects.create_user("case@example.com", "x" * 12)
    assert User.objects.get_by_natural_key("CASE@example.com").email == "case@example.com"


def test_settings_reject_unknown_keys(settings: object) -> None:
    settings.INNOTREC_AUTH = {"NOT_A_SETTING": 1}  # type: ignore[attr-defined]
    with pytest.raises(ValueError, match="NOT_A_SETTING"):
        get_auth_settings()


def test_frontend_link() -> None:
    conf = get_auth_settings()
    assert conf.frontend_link("/x/{uid}", uid="42") == "http://front.test/x/42"
