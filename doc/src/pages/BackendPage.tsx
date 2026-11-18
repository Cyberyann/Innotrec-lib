import { Code } from '../components/Code';

const SETTINGS: Array<[string, string, string]> = [
  ['APP_NAME', '"Innotrec"', 'Name used in e-mails.'],
  ['FRONTEND_URL', '"http://localhost:5173"', 'Base URL of the SPA, used to build e-mail links.'],
  ['PASSWORD_RESET_PATH', '"/reset-password/{uid}/{token}"', 'Front-end route of the reset page.'],
  [
    'VERIFY_EMAIL_PATH',
    '"/verify-email/{uid}/{token}"',
    'Front-end route of the e-mail verification page.',
  ],
  ['ALLOW_REGISTRATION', 'True', 'Disable to create accounts only through the admin API.'],
  ['REQUIRE_EMAIL_VERIFICATION', 'True', 'Refuse login until the e-mail address is confirmed.'],
  ['SEND_WELCOME_EMAIL', 'True', 'Send a welcome e-mail after verification.'],
  ['SEND_PASSWORD_CHANGED_EMAIL', 'True', 'Warn the user when the password changes.'],
  ['SUPPORT_EMAIL', '""', 'Shown in the e-mail footer.'],
  ['EMAIL_CODE_LENGTH', '6', 'Digits of e-mail 2FA codes.'],
  ['EMAIL_CODE_TTL_SECONDS', '600', 'Validity of an e-mail code.'],
  ['EMAIL_CODE_MAX_ATTEMPTS', '5', 'Wrong attempts before a code is burned.'],
  ['TWO_FACTOR_PENDING_TTL_SECONDS', '300', 'Time allowed between password and 2FA steps.'],
  ['TOTP_ISSUER', '"Innotrec"', 'Name displayed in authenticator apps.'],
  ['TOTP_VALID_WINDOW', '1', 'Accepted clock drift (in 30 s steps).'],
  ['API_PREFIX', '"/api/"', 'Paths checked by OriginCheckMiddleware.'],
  ['ALLOWED_ORIGINS', '[]', 'Front-end origins allowed to call the API.'],
  ['ENFORCE_ORIGIN_CHECK', 'True', 'Enable OriginCheckMiddleware.'],
];

const ENDPOINTS: Array<[string, string, string, string]> = [
  ['GET', 'csrf/', 'public', 'Sets the csrftoken cookie, returns { csrfToken }'],
  [
    'POST',
    'register/',
    'public',
    '{ email, password, first_name?, last_name? } → 201 user, sends the verification e-mail',
  ],
  ['POST', 'verify-email/', 'public', '{ uid, token } from the e-mail link'],
  ['POST', 'verify-email/resend/', 'public', '{ email } — always 200 (no account enumeration)'],
  [
    'POST',
    'login/',
    'public',
    '{ email, password } → { status: "authenticated", user } or { status: "2fa_required", method }',
  ],
  ['POST', 'login/2fa/', 'public', '{ code } → { status: "authenticated", user }'],
  ['POST', 'login/2fa/resend/', 'public', 'New e-mail code for the pending login'],
  ['POST', 'logout/', 'user', '204'],
  ['GET', 'me/', 'user', 'Current user'],
  ['PATCH', 'me/', 'user', '{ first_name?, last_name? }'],
  ['DELETE', 'me/', 'user', '{ password } — deletes the account'],
  ['POST', 'password/change/', 'user', '{ current_password, new_password } (session kept)'],
  ['POST', 'password/reset/', 'public', '{ email } — always 200'],
  ['POST', 'password/reset/confirm/', 'public', '{ uid, token, new_password }'],
  ['POST', '2fa/totp/setup/', 'user', '→ { secret, otpauth_url, qr_code (data: URL) }'],
  ['POST', '2fa/totp/confirm/', 'user', '{ code } → user (TOTP enabled)'],
  ['POST', '2fa/email/setup/', 'user', 'Sends a confirmation code by e-mail'],
  ['POST', '2fa/email/confirm/', 'user', '{ code } → user (e-mail 2FA enabled)'],
  ['POST', '2fa/disable/', 'user', '{ password } → user'],
  ['GET/POST', 'users/', 'staff', 'List (?search=&page=) / create { email, password, … }'],
  ['GET/PATCH/DELETE', 'users/{id}/', 'staff', 'Manage any user (cannot delete yourself)'],
];

export function BackendPage() {
  return (
    <article>
      <h1>Backend library — innotrec-auth</h1>
      <p>
        A reusable Django app. It provides the user model shared by every application, the
        authentication REST API, e-mail templates and secure defaults for DRF, sessions, CSRF and
        CORS.
      </p>

      <h2 id="install">Installation</h2>
      <Code title="pip">{`
# released version (recommended for applications)
pip install "innotrec-auth @ git+https://github.com/innotrec/innotrec-lib.git@backend-v1.0.0#subdirectory=backend_lib"
# inside this monorepo (editable, with dev tools)
pip install -e "backend_lib[dev]"
`}</Code>
      <p>
        Then follow <em>Getting started → Backend</em>: <code>presets</code> gives you{' '}
        <code>INSTALLED_APPS</code>, <code>MIDDLEWARE</code>, <code>REST_FRAMEWORK</code>, password
        validators and security settings in a few lines.
      </p>

      <h2 id="model">User model</h2>
      <p>
        <code>innotrec_auth.User</code> (UUID primary key) logs in with its <strong>e-mail</strong>.
        Fields: <code>email</code>, <code>first_name</code>, <code>last_name</code>,{' '}
        <code>is_active</code>, <code>is_staff</code>, <code>is_superuser</code>,{' '}
        <code>email_verified</code>, <code>two_factor_method</code> (<code>none</code> |{' '}
        <code>totp</code> | <code>email</code>), <code>date_joined</code>, <code>updated_at</code>.
        Reference it with <code>settings.AUTH_USER_MODEL</code>:
      </p>
      <Code title="my_app/models.py">{`
class Project(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
`}</Code>
      <p className="callout">
        Because all applications share the user tables,{' '}
        <strong>every application must use the same major version</strong> of innotrec-auth.
        Migrations of the library are only additive inside a major version.
      </p>

      <h2 id="settings">Settings — INNOTREC_AUTH</h2>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {SETTINGS.map(([key, def, desc]) => (
            <tr key={key}>
              <td>
                <code>{key}</code>
              </td>
              <td>
                <code>{def}</code>
              </td>
              <td>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Unknown keys raise an error at start-up, so typos are caught immediately.</p>

      <h2 id="endpoints">REST endpoints</h2>
      <p>
        Mounted under <code>/api/auth/</code>. Every unsafe request needs the{' '}
        <code>X-CSRFToken</code> header (handled by <code>@innotrec/ui</code>).
      </p>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Access</th>
            <th>Payload / result</th>
          </tr>
        </thead>
        <tbody>
          {ENDPOINTS.map(([method, path, access, desc]) => (
            <tr key={method + path}>
              <td>
                <code>{method}</code>
              </td>
              <td>
                <code>{path}</code>
              </td>
              <td>{access}</td>
              <td>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Errors follow DRF: <code>{'{ "field": ["message"] }'}</code> for validation,{' '}
        <code>{'{ "detail": "...", "code": "..." }'}</code> otherwise. Codes:{' '}
        <code>invalid_credentials</code>, <code>email_not_verified</code>, <code>invalid_code</code>
        , <code>no_pending_login</code>, <code>invalid_token</code>, <code>invalid_password</code>,{' '}
        <code>registration_disabled</code>.
      </p>

      <h2 id="emails">E-mail templates</h2>
      <p>
        Each e-mail has three templates in <code>innotrec_auth/templates/innotrec_auth/email/</code>
        : <code>NAME.subject.txt</code>, <code>NAME.txt</code> and <code>NAME.html</code> (HTML
        extends <code>base.html</code>). Names: <code>verify_email</code>,{' '}
        <code>password_reset</code>, <code>password_changed</code>, <code>two_factor_code</code>,{' '}
        <code>welcome</code>.
      </p>
      <p>
        To customise them in one application, create a file with the same path in the project
        templates directory:
      </p>
      <Code title="backend/templates/innotrec_auth/email/welcome.html">{`
{% extends "innotrec_auth/email/base.html" %}
{% block header %}<img src="https://cdn.example.com/logo.png" alt="{{ app_name }}" height="28">{% endblock %}
{% block content %}
  <p>Welcome {{ user.first_name }}! Your account on {{ app_name }} is ready.</p>
{% endblock %}
`}</Code>
      <p>
        Available variables: <code>user</code>, <code>app_name</code>, <code>frontend_url</code>,{' '}
        <code>support_email</code> and
        <code> link</code> / <code>code</code> / <code>ttl_minutes</code> depending on the e-mail.
        Use <code>innotrec_auth.emails.send_templated_mail(name, [email], context)</code> to send
        your own templated e-mails with the same layout.
      </p>

      <h2 id="extending">Using the library in your own code</h2>
      <Code title="my_app/views.py">{`
from rest_framework import viewsets
from innotrec_auth.permissions import IsStaff

class ReportViewSet(viewsets.ModelViewSet):
    # authentication, CSRF and throttling come from presets.rest_framework()
    serializer_class = ReportSerializer
    throttle_scope = "auth_sensitive"     # optional: stricter scoped rate

    def get_queryset(self):
        return Report.objects.filter(owner=self.request.user)

class AdminOnlyView(APIView):
    permission_classes = [IsStaff]
`}</Code>
      <ul>
        <li>
          <code>innotrec_auth.services</code>: <code>issue_email_code</code>,{' '}
          <code>verify_totp</code>, <code>send_password_reset_email</code>…
        </li>
        <li>
          <code>innotrec_auth.throttling</code>: <code>BurstRateThrottle</code>,{' '}
          <code>SustainedRateThrottle</code>, <code>AuthScopedRateThrottle</code>.
        </li>
        <li>
          Management command <code>ensure_superuser</code>: creates the first admin from{' '}
          <code>DJANGO_SUPERUSER_EMAIL/PASSWORD</code>.
        </li>
        <li>
          Django admin: users and e-mail codes are registered with a dedicated{' '}
          <code>UserAdmin</code>.
        </li>
      </ul>
    </article>
  );
}
