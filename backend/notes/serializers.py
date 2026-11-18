from rest_framework import serializers

from notes.models import Note


class NoteSerializer(serializers.ModelSerializer[Note]):
    class Meta:
        model: type[Note] = Note
        fields: list[str] = ["id", "title", "content", "category", "created_at", "updated_at"]
        read_only_fields: list[str] = ["id", "created_at", "updated_at"]
