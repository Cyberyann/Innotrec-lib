import { Link } from 'react-router';
import { Code } from '../components/Code';

export function OverviewPage() {
  return (
    <article>
      <h1>Innotrec shared libraries</h1>
      <p>
        Two libraries give every Innotrec web application the same users, the same authentication
        and the same look &amp; feel:
      </p>
      <ul>
        <li>
          <strong>
            <code>innotrec-auth</code>
          </strong>{' '}
          (folder <code>backend_lib</code>) — a Django REST Framework app: user model, registration,
          e-mail verification, login, 2FA (authenticator app or e-mail code), password reset, CSRF,
          rate limiting, HTML e-mail templates and a staff API to manage users.
        </li>
        <li>
          <strong>
            <code>@innotrec/ui</code>
          </strong>{' '}
          (folder <code>frontend_lib</code>) — a React/TypeScript package: API client with CSRF
          handling, <code>AuthProvider</code> / <code>useAuth</code>, route guards, ready-made
          authentication screens and generic components (header, menu, footer, button, input,
          textarea, image, chart, table, modal…).
        </li>
      </ul>
      <p>
        All applications point to <strong>the same PostgreSQL database</strong> for users: an
        account created in one app works in every app.
      </p>

      <h2 id="architecture">Architecture</h2>
      <svg className="archi" viewBox="0 0 760 330" role="img" aria-label="Architecture diagram">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <rect className="box" x="10" y="135" width="110" height="56" rx="8" />
        <text x="65" y="168" textAnchor="middle">
          Browser
        </text>
        <rect className="box accent" x="170" y="125" width="150" height="76" rx="8" />
        <text x="245" y="157" textAnchor="middle">
          nginx proxy
        </text>
        <text x="245" y="177" textAnchor="middle" className="muted">
          rate limit · headers
        </text>
        <rect className="box" x="380" y="20" width="170" height="60" rx="8" />
        <text x="465" y="46" textAnchor="middle">
          React app (SPA)
        </text>
        <text x="465" y="64" textAnchor="middle" className="muted">
          uses @innotrec/ui
        </text>
        <rect className="box" x="380" y="133" width="170" height="60" rx="8" />
        <text x="465" y="159" textAnchor="middle">
          Django + gunicorn
        </text>
        <text x="465" y="177" textAnchor="middle" className="muted">
          uses innotrec-auth
        </text>
        <rect className="box" x="380" y="246" width="170" height="60" rx="8" />
        <text x="465" y="272" textAnchor="middle">
          Documentation
        </text>
        <text x="465" y="290" textAnchor="middle" className="muted">
          /doc/
        </text>
        <rect className="box accent" x="600" y="110" width="150" height="56" rx="8" />
        <text x="675" y="135" textAnchor="middle">
          PostgreSQL
        </text>
        <text x="675" y="152" textAnchor="middle" className="muted">
          shared users
        </text>
        <rect className="box" x="600" y="190" width="150" height="46" rx="8" />
        <text x="675" y="218" textAnchor="middle">
          Redis (throttling)
        </text>
        <path className="arrow" d="M120 163 H168" />
        <path className="arrow" d="M320 150 L378 55" />
        <path className="arrow" d="M320 163 H378" />
        <path className="arrow" d="M320 176 L378 270" />
        <path className="arrow" d="M550 155 L598 140" />
        <path className="arrow" d="M550 172 L598 210" />
        <text x="345" y="155" className="muted">
          /api
        </text>
      </svg>
      <p>
        The browser only talks to the proxy: the SPA and the API share the same origin, so the
        session cookie stays
        <code>HttpOnly</code> + <code>SameSite</code> and no token is ever stored in JavaScript.
      </p>

      <h2 id="repository">Repository layout</h2>
      <Code>{`
innotrec-lib/
├── backend_lib/     innotrec-auth  (pip package, Django app)
├── frontend_lib/    @innotrec/ui   (npm package, React components)
├── backend/         sample Django project using backend_lib
├── frontend/        sample React app using frontend_lib (+ Playwright e2e)
├── doc/             this documentation (React app)
├── deploy/          docker-compose, nginx, Dockerfiles
├── scripts/         release / version helpers
├── .github/         CI (tests) and release workflows
└── .vscode/         recommended extensions, format on save
`}</Code>
      <p>
        Start with <Link to="/getting-started">Getting started</Link>, or jump to the{' '}
        <Link to="/components">components gallery</Link>.
      </p>
    </article>
  );
}
