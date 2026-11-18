from django.contrib import admin
from django.urls import URLPattern, URLResolver, include, path

from notes.views import health

urlpatterns: list[URLPattern | URLResolver] = [
    path("django-admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("innotrec_auth.urls")),
    path("api/", include("notes.urls")),
]
