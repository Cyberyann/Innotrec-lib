from typing import Any

from django.contrib.auth import password_validation
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from innotrec_auth.models import User

CODE_FIELD_KWARGS: dict[str, Any] = {"min_length": 6, "max_length": 10, "trim_whitespace": True}


class UserSerializer(serializers.ModelSerializer[User]):
    """Profile of the current user (self-service)."""

    full_name: serializers.CharField = serializers.CharField(read_only=True)
    two_factor_enabled: serializers.BooleanField = serializers.BooleanField(read_only=True)

    class Meta:
        model: type[User] = User
        fields: list[str] = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "email_verified",
            "two_factor_method",
            "two_factor_enabled",
            "is_staff",
            "date_joined",
        ]
        read_only_fields: list[str] = [
            "id",
            "email",
            "email_verified",
            "two_factor_method",
            "is_staff",
            "date_joined",
        ]


class AdminUserSerializer(serializers.ModelSerializer[User]):
    """Full user management for staff members."""

    password: serializers.CharField = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )
    full_name: serializers.CharField = serializers.CharField(read_only=True)

    class Meta:
        model: type[User] = User
        fields: list[str] = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "email_verified",
            "two_factor_method",
            "date_joined",
            "last_login",
        ]
        read_only_fields: list[str] = ["id", "date_joined", "last_login"]

    def validate_email(self, value: str) -> str:
        normalized: str = value.strip().lower()
        qs = User.objects.filter(email__iexact=normalized)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this e-mail already exists.")
        return normalized

    def validate_two_factor_method(self, value: str) -> str:
        if value == "totp" and (self.instance is None or not self.instance.totp_secret):
            raise serializers.ValidationError(
                "TOTP can only be enabled by the user (it requires an authenticator app)."
            )
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        password: str | None = attrs.get("password")
        if password:
            candidate: User = self.instance or User(email=attrs.get("email", ""))
            validate_password(password, candidate)
        elif self.instance is None:
            raise serializers.ValidationError({"password": "This field is required."})
        return attrs

    def create(self, validated_data: dict[str, Any]) -> User:
        password: str = validated_data.pop("password")
        email: str = validated_data.pop("email")
        return User.objects.create_user(email=email, password=password, **validated_data)

    def update(self, instance: User, validated_data: dict[str, Any]) -> User:
        password: str | None = validated_data.pop("password", None)
        if validated_data.get("two_factor_method") == "none":
            instance.totp_secret = ""
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RegisterSerializer(serializers.Serializer[User]):
    email: serializers.EmailField = serializers.EmailField()
    password: serializers.CharField = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )
    first_name: serializers.CharField = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )
    last_name: serializers.CharField = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )

    def validate_email(self, value: str) -> str:
        normalized: str = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this e-mail already exists.")
        return normalized

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        candidate: User = User(
            email=attrs["email"],
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        validate_password(attrs["password"], candidate)
        return attrs

    def create(self, validated_data: dict[str, Any]) -> User:
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer[None]):
    email: serializers.EmailField = serializers.EmailField()
    password: serializers.CharField = serializers.CharField(style={"input_type": "password"})


class CodeSerializer(serializers.Serializer[None]):
    code: serializers.CharField = serializers.CharField(**CODE_FIELD_KWARGS)


class PasswordConfirmSerializer(serializers.Serializer[None]):
    password: serializers.CharField = serializers.CharField(style={"input_type": "password"})


class PasswordChangeSerializer(serializers.Serializer[None]):
    current_password: serializers.CharField = serializers.CharField()
    new_password: serializers.CharField = serializers.CharField()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        user: User = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Incorrect password."})
        password_validation.validate_password(attrs["new_password"], user)
        return attrs


class EmailSerializer(serializers.Serializer[None]):
    email: serializers.EmailField = serializers.EmailField()


class UidTokenSerializer(serializers.Serializer[None]):
    uid: serializers.CharField = serializers.CharField()
    token: serializers.CharField = serializers.CharField()


class PasswordResetConfirmSerializer(UidTokenSerializer):
    new_password: serializers.CharField = serializers.CharField()


class TwoFactorChallengeSerializer(serializers.Serializer[None]):
    status: serializers.CharField = serializers.CharField()
    method: serializers.CharField = serializers.CharField()
