import { Code } from '../components/Code';

const BACK: Array<[string, string]> = [
  ['DJANGO_SECRET_KEY', 'Long random string. Required.'],
  ['DJANGO_DEBUG', 'true in development only.'],
  ['DJANGO_ALLOWED_HOSTS', 'Comma-separated host names served by Django.'],
  [
    'DATABASE_URL',
    'postgres://user:pass@host:5432/name — the database shared by all applications (empty = sqlite).',
  ],
  [
    'REDIS_URL',
    'redis://redis:6379/0 — shared cache for rate limiting (empty = in-process memory).',
  ],
  ['FRONTEND_URL', 'Public URL of the SPA, used in e-mail links.'],
  ['FRONTEND_ORIGINS', 'Origins allowed to call the API (CORS, CSRF, origin check).'],
  ['SECURE_COOKIES', 'true behind HTTPS.'],
  [
    'SESSION_COOKIE_DOMAIN / CSRF_COOKIE_DOMAIN',
    '.example.com to share the login between app1.example.com and app2.example.com.',
  ],
  [
    'NUM_PROXIES',
    'Reverse proxies in front of Django (1 with docker-compose) for correct client IPs.',
  ],
  ['THROTTLE_BURST / THROTTLE_SUSTAINED', 'Global rate limits, e.g. 20/second and 2000/hour.'],
  ['REQUIRE_EMAIL_VERIFICATION / ALLOW_REGISTRATION', 'Auth behaviour.'],
  ['EMAIL_URL', 'consolemail:// | smtp://host:1025 | smtp+tls://user:pass@smtp.example.com:587'],
  ['DEFAULT_FROM_EMAIL', 'Sender, e.g. "MyApp <noreply@example.com>".'],
  ['APP_NAME / SUPPORT_EMAIL', 'Shown in e-mails and authenticator apps.'],
  [
    'DJANGO_SUPERUSER_EMAIL / _PASSWORD',
    'Optional first admin created by the container entrypoint.',
  ],
];

const FRONT: Array<[string, string]> = [
  ['VITE_API_URL', 'API root seen by the browser. Keep /api behind the proxy.'],
  ['VITE_APP_NAME', 'Displayed in the header.'],
  ['VITE_DEFAULT_LOCALE', 'en or fr.'],
  ['VITE_REQUIRE_EMAIL_VERIFICATION', 'Must match the backend (changes the sign-up message).'],
  ['BACKEND_URL', 'Development only: target of the Vite /api proxy (not exposed to the browser).'],
];

function EnvTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Variable</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, desc]) => (
          <tr key={name}>
            <td>
              <code>{name}</code>
            </td>
            <td>{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EnvironmentPage() {
  return (
    <article>
      <h1>Environment variables</h1>
      <p>
        Every environment-specific value lives in a <code>.env</code> file that is{' '}
        <strong>never committed</strong> (only <code>.env.example</code> files are). Three files
        exist:
      </p>
      <ul>
        <li>
          <code>backend/.env</code> — read by Django with <code>django-environ</code> (local
          development).
        </li>
        <li>
          <code>frontend/.env</code> — read by Vite at build time; only <code>VITE_*</code> values
          reach the browser.
        </li>
        <li>
          <code>deploy/.env</code> — read by docker compose; it feeds both images.
        </li>
      </ul>

      <h2 id="backend">Backend</h2>
      <EnvTable rows={BACK} />

      <h2 id="frontend">Frontend</h2>
      <EnvTable rows={FRONT} />
      <p className="callout">
        Values prefixed with <code>VITE_</code> are embedded in the JavaScript bundle and are
        public. Never put a secret there.
      </p>

      <h2 id="link">How front and back are linked</h2>
      <Code>{`
browser ──► https://app.example.com/            (PUBLIC_URL = FRONTEND_URL = FRONTEND_ORIGINS)
        ──► https://app.example.com/api/…        (VITE_API_URL=/api, same origin, cookies SameSite=Lax)
e-mail  ──► https://app.example.com/reset-password/<uid>/<token>   (FRONTEND_URL + PASSWORD_RESET_PATH)
`}</Code>
      <p>
        If the API must live on another domain, set{' '}
        <code>VITE_API_URL=https://api.example.com/api</code> and add the SPA origin to{' '}
        <code>FRONTEND_ORIGINS</code>; cookies then need{' '}
        <code>SESSION_COOKIE_DOMAIN=.example.com</code>.
      </p>
    </article>
  );
}
