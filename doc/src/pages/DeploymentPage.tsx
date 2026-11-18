import { Code } from '../components/Code';

export function DeploymentPage() {
  return (
    <article>
      <h1>Deployment</h1>
      <p>
        The <code>deploy/</code> folder contains a production-ready docker compose stack:
      </p>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Image</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>proxy</code>
            </td>
            <td>nginx 1.27</td>
            <td>
              Only public entry point (port <code>HTTP_PORT</code>): routing, rate limiting,
              security headers.
            </td>
          </tr>
          <tr>
            <td>
              <code>backend</code>
            </td>
            <td>
              <code>backend/Dockerfile</code>
            </td>
            <td>
              Django + gunicorn (3 workers), migrations at start-up, static files with WhiteNoise.
            </td>
          </tr>
          <tr>
            <td>
              <code>frontend</code>
            </td>
            <td>
              <code>deploy/spa.Dockerfile</code>
            </td>
            <td>Vite production build served by unprivileged nginx.</td>
          </tr>
          <tr>
            <td>
              <code>doc</code>
            </td>
            <td>
              <code>deploy/spa.Dockerfile</code>
            </td>
            <td>
              This documentation, under <code>/doc/</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>db</code>
            </td>
            <td>postgres 17</td>
            <td>Shared database, internal network, persistent volume.</td>
          </tr>
          <tr>
            <td>
              <code>redis</code>
            </td>
            <td>redis 7</td>
            <td>Shared rate-limiting counters.</td>
          </tr>
          <tr>
            <td>
              <code>mailpit</code>
            </td>
            <td>
              mailpit (profile <code>dev</code>)
            </td>
            <td>Fake SMTP + web UI on :8025 for tests.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="run">Run</h2>
      <Code title="terminal">{`
cp deploy/.env.example deploy/.env           # edit secrets, PUBLIC_URL, EMAIL_URL
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml --profile dev up -d --build   # with Mailpit

# http://localhost:8080        application
# http://localhost:8080/doc/   documentation
# http://localhost:8080/django-admin/
# http://localhost:8025        e-mails (dev profile)

docker compose -f deploy/docker-compose.yml logs -f backend
docker compose -f deploy/docker-compose.yml exec backend python manage.py createsuperuser
`}</Code>

      <h2 id="https">HTTPS</h2>
      <p>
        Put a TLS terminator in front of <code>proxy</code> (Traefik, Caddy, a cloud load balancer)
        that forwards <code>X-Forwarded-Proto: https</code>, or add a <code>listen 443 ssl</code>{' '}
        server block to <code>deploy/nginx/proxy.conf</code>. Then set{' '}
        <code>PUBLIC_URL=https://app.example.com</code> and <code>SECURE_COOKIES=true</code>.
      </p>

      <h2 id="several-apps">Several applications on the same database</h2>
      <ul>
        <li>
          Each application has its own backend container, built from its own repository, with the
          same <code>DATABASE_URL</code>.
        </li>
        <li>
          Each application keeps its own tables (its Django apps); the <code>innotrec_auth_*</code>{' '}
          tables are shared.
        </li>
        <li>
          Upgrade <code>innotrec-auth</code> in all applications together when a release contains a
          migration (see the changelog).
        </li>
        <li>
          Single sign-on across sub-domains: serve the apps under <code>*.example.com</code>, set{' '}
          <code>SESSION_COOKIE_DOMAIN=.example.com</code>,{' '}
          <code>CSRF_COOKIE_DOMAIN=.example.com</code>, the same <code>DJANGO_SECRET_KEY</code> and
          a shared session store (same database = default session backend).
        </li>
      </ul>

      <h2 id="scaling">Scaling and operations</h2>
      <Code>{`
docker compose -f deploy/docker-compose.yml up -d --scale backend=3   # nginx balances on the service name
docker compose -f deploy/docker-compose.yml exec db pg_dump -U innotrec innotrec > backup.sql
`}</Code>
      <p>
        Set <code>RUN_MIGRATIONS=false</code> on all but one backend replica if you prefer running{' '}
        <code>migrate</code> as a separate job.
      </p>
    </article>
  );
}
