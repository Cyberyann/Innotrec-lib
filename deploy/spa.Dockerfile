# Builds a React workspace (frontend or doc) and serves it with an unprivileged nginx.
# Build context: repository root.
#   docker build -f deploy/spa.Dockerfile --build-arg WORKSPACE=frontend .
#   docker build -f deploy/spa.Dockerfile --build-arg WORKSPACE=doc --build-arg BASE_PATH=/doc/ .
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
COPY frontend_lib/package.json frontend_lib/
COPY frontend/package.json frontend/
COPY doc/package.json doc/
RUN npm ci --no-audit --no-fund

COPY frontend_lib frontend_lib
RUN npm run build -w @innotrec/ui

ARG WORKSPACE=frontend
ARG BASE_PATH=/
ARG VITE_API_URL=/api
ARG VITE_APP_NAME="Innotrec Sample"
ARG VITE_DEFAULT_LOCALE=en
ARG VITE_REQUIRE_EMAIL_VERIFICATION=true
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_DEFAULT_LOCALE=${VITE_DEFAULT_LOCALE} \
    VITE_REQUIRE_EMAIL_VERIFICATION=${VITE_REQUIRE_EMAIL_VERIFICATION}
COPY ${WORKSPACE} ${WORKSPACE}
RUN npm run build -w ${WORKSPACE} -- --base=${BASE_PATH}

FROM nginxinc/nginx-unprivileged:1.31-alpine
ARG WORKSPACE=frontend
ARG BASE_PATH=/
ENV SPA_BASE=${BASE_PATH}
COPY deploy/nginx/spa.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/${WORKSPACE}/dist /usr/share/nginx/html${BASE_PATH}
EXPOSE 8080
