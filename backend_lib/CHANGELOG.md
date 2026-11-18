# Changelog

All notable changes to this library are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versioning: [SemVer](https://semver.org/).
A **major** version is required for breaking API changes and for migrations that every application must apply together.

## [Unreleased]

## [1.0.0] - 2026-11-17

### Added

- `innotrec_auth.User` (UUID, e-mail login, e-mail verification, 2FA method) and `EmailCode`.
- REST API: CSRF, register, verify e-mail, login with TOTP / e-mail 2FA, logout, profile, delete account,
  password change / reset, 2FA management, staff user CRUD.
- HTML + text e-mail templates (verify, reset, password changed, 2FA code, welcome).
- `presets` for settings, `OriginCheckMiddleware`, burst / sustained / scoped throttles.
- `ensure_superuser` management command.
