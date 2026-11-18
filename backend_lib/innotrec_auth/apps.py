from django.apps import AppConfig


class InnotrecAuthConfig(AppConfig):
    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "innotrec_auth"
    label: str = "innotrec_auth"
    verbose_name: str = "Innotrec authentication"
