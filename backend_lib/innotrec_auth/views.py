from datetime import timedelta
from typing import Any

from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q, QuerySet
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from innotrec_auth import services
from innotrec_auth.conf import AuthSettings, get_auth_settings
from innotrec_auth.models import EmailCodePurpose, TwoFactorMethod, User
from innotrec_auth.permissions import IsStaff
from innotrec_auth.serializers import (
    AdminUserSerializer,
    CodeSerializer,
    EmailSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordConfirmSerializer,
    PasswordResetConfirmSerializer,
    RegisterSerializer,
    UidTokenSerializer,
    UserSerializer,
)
from innotrec_auth.tokens import decode_uid, email_verification_token, password_reset_token

PENDING_2FA_SESSION_KEY: str = "innotrec_auth_pending_2fa"
PENDING_TOTP_SESSION_KEY: str = "innotrec_auth_pending_totp_secret"
GENERIC_EMAIL_SENT: dict[str, str] = {
    "detail": "If an account matches this e-mail address, a message has been sent."
}


def _error(detail: str, code: str, http_status: int = status.HTTP_400_BAD_REQUEST) -> Response:
    return Response({"detail": detail, "code": code}, status=http_status)


def _authenticated_response(user: User) -> Response:
    return Response({"status": "authenticated", "user": UserSerializer(user).data})


@method_decorator(csrf_protect, name="dispatch")
class PublicAPIView(APIView):
    """Anonymous endpoint that still enforces CSRF (DRF only enforces it for logged-in users)."""

    permission_classes: list[type[BasePermission]] = [AllowAny]
    authentication_classes: list[type[Any]] = []


# --------------------------------------------------------------------------- CSRF
@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    """Set the ``csrftoken`` cookie. Call it once when the SPA starts."""

    permission_classes: list[type[BasePermission]] = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response({"csrfToken": get_token(request)})


# --------------------------------------------------------------------------- registration
class RegisterView(PublicAPIView):
    throttle_scope: str = "auth_register"

    def post(self, request: Request) -> Response:
        conf: AuthSettings = get_auth_settings()
        if not conf.ALLOW_REGISTRATION:
            return _error("Registration is disabled.", "registration_disabled", 403)
        serializer: RegisterSerializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = serializer.save()
        if conf.REQUIRE_EMAIL_VERIFICATION:
            services.send_verification_email(user)
        else:
            services.send_welcome_email(user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class VerifyEmailView(PublicAPIView):
    throttle_scope: str = "auth_sensitive"

    def post(self, request: Request) -> Response:
        serializer: UidTokenSerializer = UidTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User | None = decode_uid(serializer.validated_data["uid"])
        if user is None or not email_verification_token.check_token(
            user, serializer.validated_data["token"]
        ):
            return _error("Invalid or expired link.", "invalid_token")
        user.email_verified = True
        user.save(update_fields=["email_verified", "updated_at"])
        services.send_welcome_email(user)
        return Response({"detail": "E-mail address verified."})


class ResendVerificationView(PublicAPIView):
    throttle_scope: str = "auth_password_reset"

    def post(self, request: Request) -> Response:
        serializer: EmailSerializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User | None = User.objects.filter(
            email__iexact=serializer.validated_data["email"], is_active=True, email_verified=False
        ).first()
        if user is not None:
            services.send_verification_email(user)
        return Response(GENERIC_EMAIL_SENT)


# --------------------------------------------------------------------------- login / logout
class LoginView(PublicAPIView):
    throttle_scope: str = "auth_login"

    def post(self, request: Request) -> Response:
        serializer: LoginSerializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: Any = authenticate(
            request._request,
            email=serializer.validated_data["email"].lower(),
            password=serializer.validated_data["password"],
        )
        if user is None:
            return _error("Invalid e-mail or password.", "invalid_credentials")
        conf: AuthSettings = get_auth_settings()
        if conf.REQUIRE_EMAIL_VERIFICATION and not user.email_verified:
            return _error("E-mail address not verified.", "email_not_verified", 403)
        if user.two_factor_enabled:
            expires: float = (
                timezone.now() + timedelta(seconds=conf.TWO_FACTOR_PENDING_TTL_SECONDS)
            ).timestamp()
            request.session[PENDING_2FA_SESSION_KEY] = {
                "user_id": str(user.pk),
                "backend": user.backend,
                "expires": expires,
            }
            if user.two_factor_method == TwoFactorMethod.EMAIL:
                services.issue_email_code(user, EmailCodePurpose.LOGIN)
            return Response({"status": "2fa_required", "method": user.two_factor_method})
        login(request._request, user)
        return _authenticated_response(user)


def _pending_user(request: Request) -> tuple[User, str] | None:
    pending: dict[str, Any] | None = request.session.get(PENDING_2FA_SESSION_KEY)
    if not pending or pending["expires"] < timezone.now().timestamp():
        return None
    user: User | None = User.objects.filter(pk=pending["user_id"], is_active=True).first()
    if user is None:
        return None
    return user, str(pending["backend"])


class LoginTwoFactorView(PublicAPIView):
    throttle_scope: str = "auth_2fa"

    def post(self, request: Request) -> Response:
        serializer: CodeSerializer = CodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pending: tuple[User, str] | None = _pending_user(request)
        if pending is None:
            return _error("No pending login or login expired.", "no_pending_login")
        user, backend = pending
        if not services.verify_second_factor(user, serializer.validated_data["code"]):
            return _error("Invalid code.", "invalid_code")
        request.session.pop(PENDING_2FA_SESSION_KEY, None)
        login(request._request, user, backend=backend)
        return _authenticated_response(user)


class LoginTwoFactorResendView(PublicAPIView):
    throttle_scope: str = "auth_email_code"

    def post(self, request: Request) -> Response:
        pending: tuple[User, str] | None = _pending_user(request)
        if pending is None:
            return _error("No pending login or login expired.", "no_pending_login")
        user: User = pending[0]
        if user.two_factor_method != TwoFactorMethod.EMAIL:
            return _error("This account does not use e-mail codes.", "wrong_method")
        services.issue_email_code(user, EmailCodePurpose.LOGIN)
        return Response({"detail": "A new code has been sent."})


class LogoutView(APIView):
    permission_classes: list[type[BasePermission]] = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        logout(request._request)
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- current user
class MeView(APIView):
    permission_classes: list[type[BasePermission]] = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user: User = request.user  # type: ignore[assignment]
        return Response(UserSerializer(user).data)

    def patch(self, request: Request) -> Response:
        user: User = request.user  # type: ignore[assignment]
        serializer: UserSerializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request: Request) -> Response:
        serializer: PasswordConfirmSerializer = PasswordConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = request.user  # type: ignore[assignment]
        if not user.check_password(serializer.validated_data["password"]):
            return _error("Incorrect password.", "invalid_password")
        logout(request._request)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- passwords
class PasswordChangeView(APIView):
    permission_classes: list[type[BasePermission]] = [IsAuthenticated]
    throttle_scope: str = "auth_sensitive"

    def post(self, request: Request) -> Response:
        serializer: PasswordChangeSerializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user: User = request.user  # type: ignore[assignment]
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        update_session_auth_hash(request._request, user)
        services.send_password_changed_email(user)
        return Response({"detail": "Password changed."})


class PasswordResetView(PublicAPIView):
    throttle_scope: str = "auth_password_reset"

    def post(self, request: Request) -> Response:
        serializer: EmailSerializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User | None = User.objects.filter(
            email__iexact=serializer.validated_data["email"], is_active=True
        ).first()
        if user is not None and user.has_usable_password():
            services.send_password_reset_email(user)
        return Response(GENERIC_EMAIL_SENT)


class PasswordResetConfirmView(PublicAPIView):
    throttle_scope: str = "auth_sensitive"

    def post(self, request: Request) -> Response:
        serializer: PasswordResetConfirmSerializer = PasswordResetConfirmSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        user: User | None = decode_uid(serializer.validated_data["uid"])
        if user is None or not password_reset_token.check_token(
            user, serializer.validated_data["token"]
        ):
            return _error("Invalid or expired link.", "invalid_token")
        try:
            validate_password(serializer.validated_data["new_password"], user)
        except DjangoValidationError as exc:
            raise ValidationError({"new_password": list(exc.messages)}) from exc
        user.set_password(serializer.validated_data["new_password"])
        user.email_verified = True
        user.save()
        services.send_password_changed_email(user)
        return Response({"detail": "Password has been reset."})


# --------------------------------------------------------------------------- 2FA management
class _TwoFactorBase(APIView):
    permission_classes: list[type[BasePermission]] = [IsAuthenticated]
    throttle_scope: str = "auth_sensitive"


class TotpSetupView(_TwoFactorBase):
    def post(self, request: Request) -> Response:
        user: User = request.user  # type: ignore[assignment]
        secret: str = services.new_totp_secret()
        request.session[PENDING_TOTP_SESSION_KEY] = secret
        return Response(services.totp_provisioning(user, secret))


class TotpConfirmView(_TwoFactorBase):
    def post(self, request: Request) -> Response:
        serializer: CodeSerializer = CodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        secret: str | None = request.session.get(PENDING_TOTP_SESSION_KEY)
        if not secret:
            return _error("Start the TOTP setup first.", "no_pending_setup")
        if not services.verify_totp(secret, serializer.validated_data["code"]):
            return _error("Invalid code.", "invalid_code")
        user: User = request.user  # type: ignore[assignment]
        user.totp_secret = secret
        user.two_factor_method = TwoFactorMethod.TOTP
        user.save(update_fields=["totp_secret", "two_factor_method", "updated_at"])
        request.session.pop(PENDING_TOTP_SESSION_KEY, None)
        return Response(UserSerializer(user).data)


class EmailTwoFactorSetupView(_TwoFactorBase):
    throttle_scope: str = "auth_email_code"

    def post(self, request: Request) -> Response:
        user: User = request.user  # type: ignore[assignment]
        services.issue_email_code(user, EmailCodePurpose.ENABLE_2FA)
        return Response({"detail": "A code has been sent to your e-mail address."})


class EmailTwoFactorConfirmView(_TwoFactorBase):
    def post(self, request: Request) -> Response:
        serializer: CodeSerializer = CodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = request.user  # type: ignore[assignment]
        if not services.verify_email_code(
            user, EmailCodePurpose.ENABLE_2FA, serializer.validated_data["code"]
        ):
            return _error("Invalid code.", "invalid_code")
        user.two_factor_method = TwoFactorMethod.EMAIL
        user.totp_secret = ""
        user.save(update_fields=["two_factor_method", "totp_secret", "updated_at"])
        return Response(UserSerializer(user).data)


class TwoFactorDisableView(_TwoFactorBase):
    def post(self, request: Request) -> Response:
        serializer: PasswordConfirmSerializer = PasswordConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = request.user  # type: ignore[assignment]
        if not user.check_password(serializer.validated_data["password"]):
            return _error("Incorrect password.", "invalid_password")
        user.two_factor_method = TwoFactorMethod.NONE
        user.totp_secret = ""
        user.save(update_fields=["two_factor_method", "totp_secret", "updated_at"])
        return Response(UserSerializer(user).data)


# --------------------------------------------------------------------------- admin
class UserAdminViewSet(viewsets.ModelViewSet[User]):
    """CRUD on every user. Staff only. ``?search=`` filters on e-mail / names."""

    permission_classes: list[type[BasePermission]] = [IsStaff]
    serializer_class: type[BaseSerializer[User]] = AdminUserSerializer

    def get_queryset(self) -> QuerySet[User]:
        qs: QuerySet[User] = User.objects.all().order_by("email")
        search: str | None = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
        return qs

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        if str(self.get_object().pk) == str(request.user.pk):
            return _error("You cannot delete your own account here.", "self_delete")
        return super().destroy(request, *args, **kwargs)
