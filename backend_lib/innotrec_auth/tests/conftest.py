import re
from collections.abc import Callable, Iterator
from typing import Any

import pytest
from django.core import mail
from django.core.cache import cache
from rest_framework.test import APIClient

from innotrec_auth.models import User

PASSWORD: str = "Sup3r-Secret-Pass!"


@pytest.fixture(autouse=True)
def _clear_cache() -> Iterator[None]:
    cache.clear()  # reset throttling counters between tests
    yield
    cache.clear()


@pytest.fixture
def api() -> APIClient:
    return APIClient()


@pytest.fixture
def make_user(db: Any) -> Callable[..., User]:
    def factory(email: str = "alice@example.com", **kwargs: Any) -> User:
        kwargs.setdefault("email_verified", True)
        kwargs.setdefault("first_name", "Alice")
        return User.objects.create_user(email=email, password=PASSWORD, **kwargs)

    return factory


@pytest.fixture
def user(make_user: Callable[..., User]) -> User:
    return make_user()


@pytest.fixture
def staff(make_user: Callable[..., User]) -> User:
    return make_user(email="admin@example.com", is_staff=True)


@pytest.fixture
def logged_api(api: APIClient, user: User) -> APIClient:
    api.force_authenticate(user)
    return api


def last_mail_link() -> str:
    body: str = str(mail.outbox[-1].body)
    match: re.Match[str] | None = re.search(r"https?://\S+", body)
    assert match, body
    return match.group(0)


def last_mail_code() -> str:
    body: str = str(mail.outbox[-1].body)
    match: re.Match[str] | None = re.search(r"code is: (\d+)", body)
    assert match, body
    return match.group(1)


def uid_token_from_link(link: str) -> dict[str, str]:
    parts: list[str] = link.rstrip("/").split("/")
    return {"uid": parts[-2], "token": parts[-1]}
