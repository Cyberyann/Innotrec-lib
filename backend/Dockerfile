# Build context: repository root (see deploy/docker-compose.yml)
FROM python:3.15-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home /app app

# 1. shared library (from the monorepo; an external app would pin a git tag in requirements.txt)
COPY backend_lib /tmp/backend_lib
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install /tmp/backend_lib -r /tmp/requirements.txt && rm -rf /tmp/backend_lib /tmp/requirements.txt

# 2. application
COPY --chown=app:app backend/ /app/
RUN DJANGO_SECRET_KEY=collectstatic-only python manage.py collectstatic --noinput \
    && chmod +x /app/entrypoint.sh

USER app
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/api/health/').status == 200 else 1)"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-", "--forwarded-allow-ips", "*"]
