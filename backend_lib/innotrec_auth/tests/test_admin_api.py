import pytest
from rest_framework.test import APIClient

from innotrec_auth.models import User
from innotrec_auth.tests.conftest import PASSWORD

pytestmark = pytest.mark.django_db
URL: str = "/api/auth/users/"


def test_regular_user_forbidden(logged_api: APIClient) -> None:
    assert logged_api.get(URL).status_code == 403


def test_staff_crud(api: APIClient, staff: User, user: User) -> None:
    api.force_authenticate(staff)
    listing = api.get(URL)
    assert listing.status_code == 200 and listing.data["count"] == 2
    assert api.get(URL, {"search": "alice@"}).data["count"] == 1

    created = api.post(
        URL, {"email": "Created@Example.com", "password": PASSWORD, "first_name": "C"}
    )
    assert created.status_code == 201, created.data
    assert "password" not in created.data
    new_id: str = created.data["id"]
    assert User.objects.get(pk=new_id).check_password(PASSWORD)

    missing_pwd = api.post(URL, {"email": "nopwd@example.com"})
    assert missing_pwd.status_code == 400

    updated = api.patch(f"{URL}{new_id}/", {"is_active": False}, format="json")
    assert updated.status_code == 200 and updated.data["is_active"] is False

    totp = api.patch(f"{URL}{new_id}/", {"two_factor_method": "totp"}, format="json")
    assert totp.status_code == 400

    assert api.delete(f"{URL}{new_id}/").status_code == 204
    assert api.delete(f"{URL}{staff.pk}/").status_code == 400  # cannot delete yourself
