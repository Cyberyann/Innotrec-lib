"""Mount with ``path("api/auth/", include("innotrec_auth.urls"))``."""

from django.urls import URLPattern, URLResolver, include, path
from rest_framework.routers import DefaultRouter

from innotrec_auth import views

app_name: str = "innotrec_auth"

router: DefaultRouter = DefaultRouter(trailing_slash=True)
router.register("users", views.UserAdminViewSet, basename="users")

urlpatterns: list[URLPattern | URLResolver] = [
    path("csrf/", views.CsrfView.as_view(), name="csrf"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("verify-email/", views.VerifyEmailView.as_view(), name="verify-email"),
    path(
        "verify-email/resend/",
        views.ResendVerificationView.as_view(),
        name="verify-email-resend",
    ),
    path("login/", views.LoginView.as_view(), name="login"),
    path("login/2fa/", views.LoginTwoFactorView.as_view(), name="login-2fa"),
    path("login/2fa/resend/", views.LoginTwoFactorResendView.as_view(), name="login-2fa-resend"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("password/change/", views.PasswordChangeView.as_view(), name="password-change"),
    path("password/reset/", views.PasswordResetView.as_view(), name="password-reset"),
    path(
        "password/reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("2fa/totp/setup/", views.TotpSetupView.as_view(), name="2fa-totp-setup"),
    path("2fa/totp/confirm/", views.TotpConfirmView.as_view(), name="2fa-totp-confirm"),
    path("2fa/email/setup/", views.EmailTwoFactorSetupView.as_view(), name="2fa-email-setup"),
    path("2fa/email/confirm/", views.EmailTwoFactorConfirmView.as_view(), name="2fa-email-confirm"),
    path("2fa/disable/", views.TwoFactorDisableView.as_view(), name="2fa-disable"),
    path("", include(router.urls)),
]
