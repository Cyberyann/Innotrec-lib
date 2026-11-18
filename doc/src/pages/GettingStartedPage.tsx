import { Link } from 'react-router';
import { Code } from '../components/Code';

export function GettingStartedPage() {
  return (
    <article>
      <h1>Getting started</h1>

      <h2 id="monorepo">Run this repository locally</h2>
      <Code title="terminal">{`
# Python 3.12+ / Node 20+
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements-dev.txt        # installs backend_lib in editable mode
cp backend/.env.example backend/.env               # then edit (empty DATABASE_URL = sqlite)
python backend/manage.py migrate
python backend/manage.py createsuperuser
python backend/manage.py runserver                 # http://localhost:8000

npm install                                        # npm workspaces: frontend_lib, frontend, doc
cp frontend/.env.example frontend/.env
npm run dev:front                                  # http://localhost:5173 (proxies /api to :8000)
npm run dev:doc                                    # http://localhost:5174
`}</Code>
      <p className="callout">
        With <code>EMAIL_URL=consolemail://</code> the e-mails (verification link, reset link, 2FA
        code) are printed in the Django terminal.
      </p>

      <h2 id="new-app">Create a new application</h2>
      <h3>1. Backend</h3>
      <Code title="requirements.txt">{`
innotrec-auth @ git+https://github.com/innotrec/innotrec-lib.git@backend-v1.0.0#subdirectory=backend_lib
django-environ>=0.11
gunicorn>=23.0
psycopg[binary]>=3.2
redis>=5.0
`}</Code>
      <Code title="config/settings.py">{`
import environ
from innotrec_auth import presets

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env.str("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
FRONTEND_URL = env.str("FRONTEND_URL")
FRONTEND_ORIGINS = env.list("FRONTEND_ORIGINS", default=[FRONTEND_URL])

INSTALLED_APPS = [*presets.INSTALLED_APPS, "my_app"]
MIDDLEWARE = presets.MIDDLEWARE
AUTH_USER_MODEL = presets.AUTH_USER_MODEL            # "innotrec_auth.User"
AUTH_PASSWORD_VALIDATORS = presets.AUTH_PASSWORD_VALIDATORS
REST_FRAMEWORK = presets.rest_framework(num_proxies=1)
DATABASES = {"default": env.db("DATABASE_URL")}       # the SHARED database
CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache",
                      "LOCATION": env.str("REDIS_URL")}}
INNOTREC_AUTH = {
    "APP_NAME": "My application",
    "FRONTEND_URL": FRONTEND_URL,
    "ALLOWED_ORIGINS": FRONTEND_ORIGINS,
}
globals().update(presets.security(debug=DEBUG, allowed_origins=FRONTEND_ORIGINS))
globals().update(env.email_url("EMAIL_URL"))
`}</Code>
      <Code title="config/urls.py">{`
urlpatterns = [
    path("api/auth/", include("innotrec_auth.urls")),
    path("api/", include("my_app.urls")),
]
`}</Code>
      <Code title="terminal">{`python manage.py migrate   # creates (or reuses) the shared innotrec_auth tables`}</Code>
      <p>
        Your own views are protected by default (<code>IsAuthenticated</code>, CSRF, throttling):
        just write normal DRF views and use <code>request.user</code>.
      </p>

      <h3>2. Frontend</h3>
      <Code title="terminal">{`
# .npmrc  (GitHub Packages registry for the @innotrec scope)
@innotrec:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${NPM_TOKEN}

npm create vite@latest my-app -- --template react-ts
npm install @innotrec/ui react-router
`}</Code>
      <Code title="src/main.tsx">{`
import { InnotrecProvider } from '@innotrec/ui';
import '@innotrec/ui/styles.css';
import { BrowserRouter } from 'react-router';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <InnotrecProvider apiBaseUrl={import.meta.env.VITE_API_URL ?? '/api'} locale="fr">
      <App />
    </InnotrecProvider>
  </BrowserRouter>,
);
`}</Code>
      <Code title="src/App.tsx">{`
import { AppLayout, Header, Footer, LoginForm, RequireAuth, UserMenu,
         PasswordResetRequestForm, PasswordResetConfirmForm, VerifyEmail } from '@innotrec/ui';

export function App() {
  const navigate = useNavigate();
  return (
    <AppLayout header={<Header title="My app" actions={<UserMenu />} items={[{ label: 'Home', to: '/' }]} />}
               footer={<Footer owner="Innotrec" />}>
      <Routes>
        <Route path="/login" element={<LoginForm forgotPasswordTo="/forgot-password" onSuccess={() => navigate('/')} />} />
        <Route path="/forgot-password" element={<PasswordResetRequestForm loginTo="/login" />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPage />} />
        <Route path="/verify-email/:uid/:token" element={<VerifyPage />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      </Routes>
    </AppLayout>
  );
}
`}</Code>
      <Code title="vite.config.ts (development proxy → same origin)">{`
server: { proxy: { '/api': 'http://localhost:8000' } }
`}</Code>
      <p>
        The routes <code>/reset-password/:uid/:token</code> and{' '}
        <code>/verify-email/:uid/:token</code> must match <code>PASSWORD_RESET_PATH</code> /{' '}
        <code>VERIFY_EMAIL_PATH</code> of the backend: they are the links sent by e-mail.
      </p>

      <h3>3. Deploy</h3>
      <p>
        Copy <code>deploy/</code> and adapt the service names — see{' '}
        <Link to="/deployment">Deployment</Link>.
      </p>
    </article>
  );
}
