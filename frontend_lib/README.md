# @innotrec/ui (frontend library)

React / TypeScript package shared by every Innotrec application: authentication against `innotrec-auth` and a set of
accessible, themeable UI components. No runtime dependency besides its peers `react`, `react-dom` and `react-router` (v7).

## Install

```bash
# .npmrc
@innotrec:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}

npm install @innotrec/ui react-router
```

```tsx
import { InnotrecProvider, LoginForm, RequireAuth, useAuth } from '@innotrec/ui';
import '@innotrec/ui/styles.css';

<BrowserRouter>
  <InnotrecProvider apiBaseUrl="/api" locale="fr">
    <Routes>
      <Route
        path="/login"
        element={<LoginForm forgotPasswordTo="/forgot-password" onSuccess={() => navigate('/')} />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
    </Routes>
  </InnotrecProvider>
</BrowserRouter>;
```

## Content

| Area         | Exports                                                                                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API          | `ApiClient` (cookies + CSRF + `ApiError`), `createAuthApi`, types (`User`, `LoginResult`, …)                                                                                                                                        |
| Auth         | `InnotrecProvider`, `AuthProvider`, `useAuth`, `RequireAuth`, `RequireAnonymous`, `useApiForm`                                                                                                                                      |
| Auth screens | `LoginForm` (TOTP / e-mail 2FA), `RegisterForm`, `PasswordResetRequestForm`, `PasswordResetConfirmForm`, `VerifyEmail`, `ProfileForm`, `ChangePasswordForm`, `TwoFactorSettings`, `DeleteAccountForm`, `UserMenu`, `UserManagement` |
| Layout       | `AppLayout`, `Header`, `Menu`, `Footer`                                                                                                                                                                                             |
| Components   | `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Image`, `Card`, `Alert`, `Badge`, `Spinner`, `Modal`, `DataTable`, `Chart`                                                                                                    |
| i18n / theme | `I18nProvider`, `useI18n`, `en`, `fr`; CSS variables `--iu-*`, dark mode                                                                                                                                                            |

Live examples and props tables: documentation app (`doc/` → _Components_).

## Development

```bash
npm run test -w @innotrec/ui         # Vitest + Testing Library
npm run test:watch -w @innotrec/ui
npm run build -w @innotrec/ui        # dist/index.js + dist/*.d.ts + dist/styles.css
npm run typecheck -w @innotrec/ui
```

The sample app (`npm run dev:front`) and the documentation import the library **sources** in development (instant HMR) and
the **built package** in production builds — exactly like an external application.

Adding a component: see `doc` → _Create a component_ (typed props, `iu-` CSS classes using `--iu-*` tokens, i18n keys in `en`
and `fr`, tests, export in `src/index.ts`, changelog entry). Release with `../scripts/release.sh frontend patch|minor|major`.
