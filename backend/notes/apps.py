from django.apps import AppConfig


class NotesConfig(AppConfig):
    default_auto_field: str = "django.db.models.BigAutoField"
    name: str = "notes"
