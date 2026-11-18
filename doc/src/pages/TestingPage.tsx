import { Code } from '../components/Code';

export function TestingPage() {
  return (
    <article>
      <h1>Testing</h1>
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Tool</th>
            <th>Where</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit / API (backend)</td>
            <td>pytest + pytest-django</td>
            <td>
              <code>backend_lib/innotrec_auth/tests</code>, <code>backend/notes/tests</code>
            </td>
          </tr>
          <tr>
            <td>E2E API scenario</td>
            <td>pytest (CSRF enforced, real cookies)</td>
            <td>
              <code>backend_lib/innotrec_auth/tests/e2e</code>
            </td>
          </tr>
          <tr>
            <td>Unit / component (frontend)</td>
            <td>Vitest + Testing Library</td>
            <td>
              <code>frontend_lib/src/**/*.test.tsx</code>, <code>frontend/src/*.test.tsx</code>
            </td>
          </tr>
          <tr>
            <td>E2E browser (mocked API)</td>
            <td>Playwright</td>
            <td>
              <code>frontend/e2e/auth.spec.ts</code>
            </td>
          </tr>
          <tr>
            <td>E2E full stack</td>
            <td>Playwright + docker compose + Mailpit</td>
            <td>
              <code>frontend/e2e/stack.spec.ts</code>
            </td>
          </tr>
          <tr>
            <td>Static checks</td>
            <td>black, ruff, mypy --strict, tsc, eslint, prettier</td>
            <td>CI</td>
          </tr>
        </tbody>
      </table>
      <Code title="terminal">{`
# backend
cd backend_lib && pytest --cov=innotrec_auth && mypy innotrec_auth && black --check . && ruff check .
cd backend && pytest && mypy .

# frontend
npm test                       # library + sample app (Vitest)
npx playwright install --with-deps chromium
npm run test:e2e               # Playwright, mocked API, starts Vite automatically

# full stack
docker compose -f deploy/docker-compose.yml --profile dev up -d --build
npm run test:e2e:stack -w innotrec-sample-frontend
`}</Code>
    </article>
  );
}
