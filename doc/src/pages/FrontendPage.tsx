import { Code, PropsTable } from '../components/Code';

export function FrontendPage() {
  return (
    <article>
      <h1>Frontend library — @innotrec/ui</h1>
      <p>
        React 18/19 + TypeScript, no runtime dependency besides its peers (<code>react</code>,{' '}
        <code>react-dom</code>, <code>react-router</code> v7). Ships ESM + type declarations + one
        CSS file.
      </p>

      <h2 id="install">Installation</h2>
      <Code title=".npmrc">{`
@innotrec:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${NPM_TOKEN}
`}</Code>
      <Code title="terminal">{`npm install @innotrec/ui react-router`}</Code>
      <Code title="src/main.tsx">{`
import { InnotrecProvider } from '@innotrec/ui';
import '@innotrec/ui/styles.css';

<BrowserRouter>
  <InnotrecProvider apiBaseUrl="/api" locale="fr" messages={{ 'login.title': 'Connexion à MonApp' }}>
    <App />
  </InnotrecProvider>
</BrowserRouter>
`}</Code>
      <PropsTable
        rows={[
          {
            name: 'apiBaseUrl',
            type: 'string',
            default: "'/api'",
            description: 'API root. Keep it same-origin (proxy) in production.',
          },
          {
            name: 'client',
            type: 'ApiClient',
            description: 'Bring your own client (custom CSRF names, onUnauthorized…).',
          },
          {
            name: 'authPrefix',
            type: 'string',
            default: "'/auth'",
            description: 'Where innotrec_auth.urls is mounted inside the API.',
          },
          {
            name: 'locale',
            type: "'en' | 'fr' | string",
            default: "'en'",
            description: 'Built-in translations: en, fr.',
          },
          {
            name: 'messages',
            type: 'Partial<Messages>',
            description: 'Override any text of the library.',
          },
        ]}
      />

      <h2 id="use-auth">useAuth()</h2>
      <Code>{`
const { user, status, login, verifyTwoFactor, logout, refresh, setUser, api, client } = useAuth();

status            // 'loading' | 'authenticated' | 'anonymous'
user              // User | null  (id, email, first_name, last_name, is_staff, two_factor_method…)
api.register({...}), api.requestPasswordReset(email), api.totpSetup(), api.users.list({ search })…
`}</Code>

      <h2 id="client">Calling your own API endpoints</h2>
      <p>
        Reuse the shared <code>ApiClient</code>: cookies, CSRF header and error parsing are handled
        for you. Errors are thrown as <code>ApiError</code> (<code>status</code>, <code>code</code>,{' '}
        <code>fieldErrors</code>, <code>message</code>).
      </p>
      <Code title="src/api/projects.ts">{`
import type { ApiClient, Paginated } from '@innotrec/ui';

export const projectsApi = (client: ApiClient) => ({
  list: (page = 1) => client.get<Paginated<Project>>('/projects/', { query: { page } }),
  create: (input: ProjectInput) => client.post<Project>('/projects/', input),
  remove: (id: number) => client.delete<void>(\`/projects/\${id}/\`),
});

// in a component
const { client } = useAuth();
const api = useMemo(() => projectsApi(client), [client]);
`}</Code>
      <Code title="forms: useApiForm()">{`
const form = useApiForm();
const onSubmit = async (e: FormEvent) => {
  e.preventDefault();
  const project = await form.run(() => api.create(values));   // undefined on error
  if (project) navigate('/projects');
};
<Input label="Name" error={form.fieldError('name')} />          // DRF field errors
{form.error && <Alert variant="error">{form.error}</Alert>}
<Button type="submit" loading={form.submitting}>Save</Button>
`}</Code>

      <h2 id="guards">Route guards</h2>
      <Code>{`
<Route path="/admin" element={<RequireAuth staff forbidden={<NoAccess />}><Admin /></RequireAuth>} />
<Route path="/login" element={<RequireAnonymous><LoginPage /></RequireAnonymous>} />
`}</Code>
      <p>
        <code>RequireAuth</code> sends anonymous users to <code>/login</code> with the original
        location in <code>state.from</code>; <code>RequireAnonymous</code> sends them back there
        after login.
      </p>

      <h2 id="i18n">Translations</h2>
      <Code>{`
import { useI18n, fr } from '@innotrec/ui';
const { t, locale } = useI18n();
t('twofa.status', { method: 'e-mail' });

// add a language
<InnotrecProvider locale="de" messages={{ ...deMessages }} />
`}</Code>

      <h2 id="theme">Theming</h2>
      <p>
        Every color, radius and font is a CSS variable prefixed with <code>--iu-</code>. Override
        them in your application stylesheet. Dark mode follows the OS, or force it with{' '}
        <code>{'<html data-theme="dark">'}</code>.
      </p>
      <Code title="src/app.css">{`
:root {
  --iu-color-primary: #0f766e;
  --iu-color-primary-hover: #115e59;
  --iu-radius: 4px;
  --iu-font: 'Roboto', sans-serif;
  --iu-chart-1: #0f766e;
}
`}</Code>
    </article>
  );
}
