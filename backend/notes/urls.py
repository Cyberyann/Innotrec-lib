from django.urls import URLPattern, URLResolver, include, path
from rest_framework.routers import DefaultRouter

from notes.views import NoteViewSet

router: DefaultRouter = DefaultRouter()
router.register("notes", NoteViewSet, basename="notes")

urlpatterns: list[URLPattern | URLResolver] = [path("", include(router.urls))]
