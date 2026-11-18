from django.urls import URLResolver, include, path

urlpatterns: list[URLResolver] = [path("api/auth/", include("innotrec_auth.urls"))]
