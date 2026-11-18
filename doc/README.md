# Documentation app

React application documenting the libraries. It is built with `@innotrec/ui` itself, so the _Components_ page shows live,
interactive examples (authentication forms run against a simulated backend: `demo@example.com` / `demo-password`, 2FA code
`123456`).

Pages: overview & architecture · getting started (new application step by step) · backend library (settings, endpoints, e-mail
templates) · frontend library (provider, `useAuth`, API client, guards, i18n, theming) · components · create a component ·
environment variables · security · testing · deployment · updating the libraries.

```bash
npm run dev:doc             # from the repository root → http://localhost:5174
npm test -w innotrec-doc    # renders every page
npm run build -w innotrec-doc -- --base=/doc/
```

In docker compose it is served under `/doc/` (see `deploy/spa.Dockerfile`). Add a page: create `src/pages/XxxPage.tsx` and
register it in `PAGES` (`src/DocApp.tsx`).
