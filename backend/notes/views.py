from typing import Any

from django.db import connection
from django.db.models import Count, QuerySet
from django.http import HttpRequest, JsonResponse
from innotrec_auth.models import User
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from notes.models import Category, Note
from notes.serializers import NoteSerializer


def health(request: HttpRequest) -> JsonResponse:
    """Liveness/readiness probe used by docker-compose (no auth, no throttling)."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return JsonResponse({"status": "ok"})


class NoteViewSet(viewsets.ModelViewSet[Note]):
    """CRUD on the current user's notes (authentication required by default settings)."""

    serializer_class: type[NoteSerializer] = NoteSerializer

    def get_queryset(self) -> QuerySet[Note]:
        user: User = self.request.user  # type: ignore[assignment]
        return Note.objects.filter(owner=user)

    def perform_create(self, serializer: NoteSerializer) -> None:  # type: ignore[override]
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=["get"])
    def stats(self, request: Request) -> Response:
        """Data for the dashboard chart: number of notes per category."""
        counts: dict[str, int] = {
            row["category"]: row["total"]
            for row in self.get_queryset().values("category").annotate(total=Count("id"))
        }
        data: list[dict[str, Any]] = [
            {"label": label, "value": counts.get(value, 0)} for value, label in Category.choices
        ]
        return Response(data)
