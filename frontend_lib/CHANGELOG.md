# Changelog

All notable changes to this library are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versioning: [SemVer](https://semver.org/).
A **major** version is required for breaking API changes and for migrations that every application must apply together.

## [Unreleased]

## [1.0.0] - 2026-11-17

### Added

- `ApiClient` (cookies + CSRF + typed errors), `createAuthApi`, `InnotrecProvider`, `AuthProvider`, `useAuth`,
  `RequireAuth`, `RequireAnonymous`, `useApiForm`, i18n (en, fr).
- Components: AppLayout, Header, Menu, Footer, Button, Input, Textarea, Select, Checkbox, Image, Card, Alert,
  Badge, Spinner, Modal, DataTable, Chart (bar / line / donut).
- Auth screens: LoginForm (2FA), RegisterForm, PasswordResetRequestForm, PasswordResetConfirmForm, VerifyEmail,
  ProfileForm, ChangePasswordForm, TwoFactorSettings, DeleteAccountForm, UserMenu, UserManagement.
