from collections.abc import Callable
from typing import Any

import pytest
from django.core.cache import cache
from innotrec_auth.models import User
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _clear_cache() -> None:
    cache.clear()


@pytest.fixture
def make_client(db: Any) -> Callable[[str], APIClient]:
    def factory(email: str) -> APIClient:
        user: User = User.objects.create_user(email, "Passw0rd-Long!", email_verified=True)
        client: APIClient = APIClient()
        client.force_authenticate(user)
        return client

    return factory


def test_health() -> None:
    assert APIClient().get("/api/health/").json() == {"status": "ok"}


def test_notes_require_authentication() -> None:
    assert APIClient().get("/api/notes/").status_code == 403


def test_notes_crud_and_isolation(make_client: Callable[[str], APIClient]) -> None:
    alice: APIClient = make_client("alice@example.com")
    bob: APIClient = make_client("bob@example.com")

    created = alice.post("/api/notes/", {"title": "Hello", "category": "idea"})
    assert created.status_code == 201
    note_id: int = created.data["id"]

    assert alice.get("/api/notes/").data["count"] == 1
    assert bob.get("/api/notes/").data["count"] == 0
    assert bob.get(f"/api/notes/{note_id}/").status_code == 404

    assert alice.patch(f"/api/notes/{note_id}/", {"title": "Hi"}).data["title"] == "Hi"
    assert alice.delete(f"/api/notes/{note_id}/").status_code == 204


def test_stats(make_client: Callable[[str], APIClient]) -> None:
    client: APIClient = make_client("stats@example.com")
    for category in ["work", "work", "idea"]:
        client.post("/api/notes/", {"title": "n", "category": category})
    data = client.get("/api/notes/stats/").data
    assert {"label": "Work", "value": 2} in data
    assert {"label": "Personal", "value": 0} in data
    assert {"label": "Idea", "value": 1} in data


def test_auth_routes_mounted() -> None:
    assert APIClient().get("/api/auth/csrf/").status_code == 200
