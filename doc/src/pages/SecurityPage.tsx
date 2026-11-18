export function SecurityPage() {
  const rows: Array<[string, string]> = [
    [
      'Session cookie',
      'HttpOnly, SameSite=Lax, Secure in production, 12 h. No token in localStorage: XSS cannot steal the session.',
    ],
    [
      'CSRF',
      'Django CSRF on every unsafe request, including anonymous ones (login, register, reset). The client sends X-CSRFToken from the csrftoken cookie.',
    ],
    [
      'Origin check',
      'OriginCheckMiddleware rejects API calls whose Origin / Referer / Sec-Fetch-Site is not an allowed front-end.',
    ],
    ['CORS', 'django-cors-headers: only FRONTEND_ORIGINS, with credentials.'],
    [
      'Rate limiting (nginx)',
      '30 req/s per IP on /api, 5 req/s on /api/auth and the admin, 50 concurrent connections, HTTP 429.',
    ],
    [
      'Rate limiting (Django)',
      'burst 20/second + sustained 2000/hour per user or IP, and scoped limits: login 5/min, 2FA 10/min, register 5/h, reset 5/h, e-mail codes 5/h. Stored in Redis so all workers share counters.',
    ],
    [
      'Passwords',
      'Django hashers (PBKDF2/Argon2), validators: min 10 chars, not common, not numeric, not similar to the user.',
    ],
    [
      'Account enumeration',
      'Password reset and resend-verification always answer the same message.',
    ],
    [
      '2FA',
      'TOTP (RFC 6238, ±30 s) or 6-digit e-mail codes: stored as HMAC-SHA256, single use, 10 min, 5 attempts max, previous codes revoked.',
    ],
    [
      'Session after password change',
      'Every other session is invalidated; the current one is kept.',
    ],
    [
      'Security headers',
      'CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS (Django, production).',
    ],
    [
      'Network isolation',
      'Only the nginx proxy publishes a port. PostgreSQL and Redis are on an internal Docker network without internet access.',
    ],
    ['Containers', 'Backend and SPAs run as non-root users; the proxy hides its version.'],
  ];
  return (
    <article>
      <h1>Security</h1>
      <p>What the libraries and the deployment do for you:</p>
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Implementation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([topic, impl]) => (
            <tr key={topic}>
              <td>
                <strong>{topic}</strong>
              </td>
              <td>{impl}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 id="checklist">Production checklist</h2>
      <ul>
        <li>
          HTTPS in front of the proxy, then <code>SECURE_COOKIES=true</code> and{' '}
          <code>PUBLIC_URL=https://…</code>.
        </li>
        <li>
          Strong unique <code>DJANGO_SECRET_KEY</code> and <code>POSTGRES_PASSWORD</code>.
        </li>
        <li>
          Restrict <code>/django-admin/</code> to your network (see the comment in{' '}
          <code>deploy/nginx/proxy.conf</code>).
        </li>
        <li>Real SMTP with SPF/DKIM for the sender domain.</li>
        <li>
          Database backups (<code>pg_dump</code>) and log collection.
        </li>
        <li>Keep the libraries up to date (Dependabot is configured for pip, npm and Docker).</li>
      </ul>
    </article>
  );
}
