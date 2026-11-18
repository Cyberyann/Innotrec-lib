from django.contrib import admin

from notes.models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display: tuple[str, ...] = ("title", "owner", "category", "created_at")
