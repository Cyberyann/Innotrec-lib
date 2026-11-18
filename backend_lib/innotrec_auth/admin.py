from typing import TYPE_CHECKING, ClassVar

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AdminUserCreationForm, UserChangeForm

from innotrec_auth.models import EmailCode, User

if TYPE_CHECKING:
    from django.contrib.admin.options import _FieldsetSpec


class InnotrecUserCreationForm(AdminUserCreationForm):  # type: ignore[type-arg]
    class Meta:
        model: type[User] = User
        fields: tuple[str, ...] = ("email",)


class InnotrecUserChangeForm(UserChangeForm):  # type: ignore[type-arg]
    class Meta:
        model: type[User] = User
        fields: str = "__all__"


@admin.register(User)
class UserAdmin(BaseUserAdmin):  # type: ignore[type-arg]
    form: type[InnotrecUserChangeForm] = InnotrecUserChangeForm
    add_form: type[InnotrecUserCreationForm] = InnotrecUserCreationForm
    ordering: ClassVar[tuple[str, ...]] = ("email",)
    list_display: tuple[str, ...] = (
        "email",
        "first_name",
        "last_name",
        "is_active",
        "is_staff",
        "email_verified",
        "two_factor_method",
    )
    list_filter: ClassVar[tuple[str, ...]] = (
        "is_active",
        "is_staff",
        "email_verified",
        "two_factor_method",
    )
    search_fields: ClassVar[tuple[str, ...]] = ("email", "first_name", "last_name")
    readonly_fields: ClassVar[tuple[str, ...]] = ("date_joined", "last_login", "updated_at")
    fieldsets: ClassVar["_FieldsetSpec"] = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("first_name", "last_name", "email_verified")}),
        ("Two-factor", {"fields": ("two_factor_method",)}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Dates", {"fields": ("date_joined", "last_login", "updated_at")}),
    )
    add_fieldsets: "_FieldsetSpec" = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "usable_password", "password1", "password2"),
            },
        ),
    )


@admin.register(EmailCode)
class EmailCodeAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display: tuple[str, ...] = (
        "user",
        "purpose",
        "created_at",
        "expires_at",
        "consumed_at",
    )
    readonly_fields: ClassVar[tuple[str, ...]] = ("code_hash",)
