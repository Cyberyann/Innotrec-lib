import {
  Alert,
  Badge,
  Button,
  Card,
  Chart,
  Checkbox,
  DataTable,
  Footer,
  Header,
  Image,
  Input,
  LoginForm,
  Menu,
  Modal,
  PasswordResetRequestForm,
  RegisterForm,
  Select,
  Spinner,
  Textarea,
  type ChartDatum,
} from '@innotrec/ui';
import { useState, type ReactNode } from 'react';
import { Code, PropsTable } from '../components/Code';
import { DemoProvider } from '../components/DemoProvider';

const SALES: ChartDatum[] = [
  { label: 'Jan', value: 12 },
  { label: 'Feb', value: 19 },
  { label: 'Mar', value: 9 },
  { label: 'Apr', value: 24 },
  { label: 'May', value: 17 },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function ComponentsPage() {
  const [modal, setModal] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'donut'>('bar');
  return (
    <article>
      <h1>Components</h1>
      <p>Every example below is live and rendered with the library itself.</p>
      <Code>{`import { Button, Input, Chart, LoginForm } from '@innotrec/ui';`}</Code>

      <Section id="button" title="Button">
        <div className="demo demo-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button loading>Saving</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" icon={<span aria-hidden>＋</span>}>
            Large with icon
          </Button>
        </div>
        <Code>{`<Button variant="danger" size="sm" loading={saving} onClick={remove}>Delete</Button>`}</Code>
        <PropsTable
          rows={[
            {
              name: 'variant',
              type: "'primary' | 'secondary' | 'danger' | 'ghost' | 'link'",
              default: "'primary'",
              description: 'Visual style.',
            },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size.' },
            {
              name: 'loading',
              type: 'boolean',
              default: 'false',
              description: 'Spinner + disabled + aria-busy.',
            },
            {
              name: 'fullWidth',
              type: 'boolean',
              default: 'false',
              description: 'Take the whole width.',
            },
            { name: 'icon', type: 'ReactNode', description: 'Leading icon.' },
            {
              name: '...rest',
              type: 'ButtonHTMLAttributes',
              description: 'Any native attribute (type defaults to "button").',
            },
          ]}
        />
      </Section>

      <Section id="input" title="Input · Textarea · Select · Checkbox">
        <div className="demo">
          <div className="iu-grid-2">
            <Input
              label="E-mail"
              type="email"
              placeholder="jane@example.com"
              hint="We never share it."
              required
            />
            <Input label="Password" type="password" defaultValue="secret-value" />
            <Input label="With error" defaultValue="oops" error="This value is invalid." />
            <Select
              label="Country"
              placeholder="Choose…"
              options={[
                { value: 'fr', label: 'France' },
                { value: 'be', label: 'Belgium' },
              ]}
            />
          </div>
          <Textarea label="Message" maxLength={200} placeholder="Type something…" />
          <Checkbox label="Accept the terms" />
          <Checkbox switch label="Notifications" defaultChecked />
        </div>
        <Code>{`
<Input label="E-mail" type="email" required error={form.fieldError('email')} hint="We never share it." />
<Input label="Password" type="password" revealable />   {/* eye button to show the value */}
<Textarea label="Message" maxLength={200} />            {/* character counter */}
<Select label="Country" placeholder="Choose…" options={[{ value: 'fr', label: 'France' }]} />
<Checkbox switch label="Notifications" checked={on} onChange={(e) => setOn(e.target.checked)} />
`}</Code>
        <PropsTable
          rows={[
            {
              name: 'label',
              type: 'ReactNode',
              description: 'Linked to the control with htmlFor/id (auto-generated id).',
            },
            { name: 'hint', type: 'ReactNode', description: 'Help text (aria-describedby).' },
            {
              name: 'error',
              type: 'ReactNode',
              description: 'Error text: red border, aria-invalid, role="alert".',
            },
            {
              name: 'required',
              type: 'boolean',
              description: 'Adds a visual * and the native attribute.',
            },
            {
              name: 'revealable',
              type: 'boolean',
              default: 'true',
              description: 'Input type=password only: show/hide button.',
            },
            {
              name: 'showCount',
              type: 'boolean',
              default: 'true',
              description: 'Textarea with maxLength: counter.',
            },
            {
              name: 'options / placeholder',
              type: 'SelectOption[] / string',
              description: 'Select only.',
            },
            {
              name: 'switch',
              type: 'boolean',
              default: 'false',
              description: 'Checkbox only: render as a toggle (role="switch").',
            },
          ]}
        />
      </Section>

      <Section id="image" title="Image">
        <div className="demo demo-row">
          <Image
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Logo"
            width={96}
            rounded
            caption="rounded + caption"
          />
          <Image
            src="/does-not-exist.png"
            fallbackSrc={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Fallback"
            width={96}
            rounded="full"
            caption="fallbackSrc"
          />
        </div>
        <Code>{`<Image src={user.avatar} fallbackSrc="/avatar.svg" alt="Avatar" aspectRatio="1/1" rounded="full" width={64} />`}</Code>
        <p>
          Lazy-loaded by default, <code>alt</code> is mandatory (use <code>alt=""</code> for
          decorative images).
        </p>
      </Section>

      <Section id="chart" title="Chart">
        <div className="demo">
          <div className="demo-row" style={{ marginBottom: '1rem' }}>
            {(['bar', 'line', 'donut'] as const).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={chartType === type ? 'primary' : 'secondary'}
                onClick={() => setChartType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
          <Chart
            type={chartType}
            title="Sales per month"
            data={SALES}
            formatValue={(v) => `${v} k€`}
          />
        </div>
        <Code>{`<Chart type="bar" title="Sales per month" data={[{ label: 'Jan', value: 12 }]} formatValue={(v) => \`\${v} k€\`} />`}</Code>
        <PropsTable
          rows={[
            {
              name: 'type',
              type: "'bar' | 'line' | 'donut'",
              default: "'bar'",
              description: 'Chart kind.',
            },
            { name: 'data', type: '{ label, value, color? }[]', description: 'One series.' },
            {
              name: 'title',
              type: 'string',
              description: 'Required: accessible name (+ visible caption unless hideTitle).',
            },
            {
              name: 'height',
              type: 'number',
              default: '260',
              description: 'SVG height (width is responsive).',
            },
            {
              name: 'formatValue',
              type: '(n) => string',
              description: 'Axis / tooltip formatting.',
            },
          ]}
        />
        <p>
          Pure SVG, no dependency. Colors come from <code>--iu-chart-1…6</code>; a hidden table
          exposes the data to screen readers.
        </p>
      </Section>

      <Section id="feedback" title="Alert · Badge · Spinner · Card">
        <div className="demo">
          <Alert variant="info">Information message.</Alert>
          <Alert variant="success" title="Saved">
            Your changes have been saved.
          </Alert>
          <Alert variant="warning">Your session expires soon.</Alert>
          <Alert variant="error" onClose={() => undefined}>
            Something went wrong.
          </Alert>
          <div className="demo-row">
            <Badge>neutral</Badge>
            <Badge variant="success">active</Badge>
            <Badge variant="warning">pending</Badge>
            <Badge variant="danger">blocked</Badge>
            <Badge variant="info">new</Badge>
            <Spinner size="sm" />
            <Spinner />
          </div>
          <Card
            title="Card title"
            subtitle="Optional subtitle"
            actions={
              <Button size="sm" variant="secondary">
                Action
              </Button>
            }
            footer="Card footer"
          >
            Card content.
          </Card>
        </div>
      </Section>

      <Section id="modal" title="Modal">
        <div className="demo">
          <Button onClick={() => setModal(true)}>Open the modal</Button>
          <Modal
            open={modal}
            onClose={() => setModal(false)}
            title="Confirm"
            footer={<Button onClick={() => setModal(false)}>OK</Button>}
          >
            Focus is trapped inside, <kbd>Esc</kbd> or a click on the backdrop closes it, focus
            returns to the button.
          </Modal>
        </div>
        <Code>{`<Modal open={open} onClose={() => setOpen(false)} title="Confirm" size="sm" footer={<Button>OK</Button>}>…</Modal>`}</Code>
      </Section>

      <Section id="table" title="DataTable">
        <div className="demo">
          <DataTable
            rowKey={(r) => r.id}
            columns={[
              { key: 'name', header: 'Name' },
              {
                key: 'role',
                header: 'Role',
                render: (r) => <Badge variant="info">{r.role}</Badge>,
              },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => `${r.amount} €` },
            ]}
            rows={[
              { id: 1, name: 'Alice', role: 'admin', amount: 120 },
              { id: 2, name: 'Bob', role: 'user', amount: 80 },
            ]}
          />
        </div>
        <Code>{`<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} empty="Nothing yet" />`}</Code>
      </Section>

      <Section id="layout" title="Header · Menu · Footer · AppLayout">
        <div className="demo">
          <Header
            sticky={false}
            title="My app"
            logoSrc={`${import.meta.env.BASE_URL}logo.svg`}
            items={[
              { label: 'Components', to: '/components' },
              { label: 'Docs home', to: '/' },
            ]}
            actions={<Button size="sm">Sign in</Button>}
          />
          <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0' }}>
            <div style={{ width: 200 }}>
              <Menu
                orientation="vertical"
                ariaLabel="Demo"
                items={[
                  { label: 'Components', to: '/components' },
                  { label: 'External', href: 'https://react.dev' },
                ]}
              />
            </div>
            <p>
              Active links are highlighted automatically (react-router <code>NavLink</code>). On
              small screens the header shows a burger button.
            </p>
          </div>
          <Footer owner="Innotrec" links={[{ label: 'Legal notice', href: '#' }]} />
        </div>
        <Code>{`
<AppLayout
  header={<Header title="My app" logoSrc="/logo.svg" items={[{ label: 'Home', to: '/' }]} actions={<UserMenu />} />}
  sidebar={<Menu orientation="vertical" items={items} />}          // optional
  footer={<Footer owner="Innotrec" links={[{ label: 'Legal', href: '/legal' }]} />}
>
  <Routes>…</Routes>
</AppLayout>
`}</Code>
      </Section>

      <Section id="auth" title="Authentication components">
        <p>
          Ready-made screens connected to the backend through <code>useAuth()</code>. The demos
          below use a simulated backend: log in with <code>demo@example.com</code> /{' '}
          <code>demo-password</code>, the 2FA code is <code>123456</code>.
        </p>
        <div
          className="grid-demo"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="demo">
            <strong>LoginForm (with e-mail 2FA)</strong>
            <DemoProvider twoFactor>
              <LoginForm
                forgotPasswordTo="/components#auth"
                onSuccess={(u) => alert(`Welcome ${u.full_name}`)}
              />
            </DemoProvider>
          </div>
          <div className="demo">
            <strong>RegisterForm (French)</strong>
            <DemoProvider locale="fr">
              <RegisterForm />
            </DemoProvider>
          </div>
          <div className="demo">
            <strong>PasswordResetRequestForm</strong>
            <DemoProvider>
              <PasswordResetRequestForm />
            </DemoProvider>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Main props</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>LoginForm</code>
              </td>
              <td>
                <code>onSuccess, forgotPasswordTo, registerTo, title</code>
              </td>
              <td>Password, then TOTP or e-mail code; resend code; resend verification e-mail.</td>
            </tr>
            <tr>
              <td>
                <code>RegisterForm</code>
              </td>
              <td>
                <code>onSuccess, loginTo, requireEmailVerification</code>
              </td>
              <td>Sign-up with confirmation field and server-side password rules.</td>
            </tr>
            <tr>
              <td>
                <code>PasswordResetRequestForm</code>
              </td>
              <td>
                <code>loginTo</code>
              </td>
              <td>Sends the reset link.</td>
            </tr>
            <tr>
              <td>
                <code>PasswordResetConfirmForm</code>
              </td>
              <td>
                <code>uid, token, loginTo, onSuccess</code>
              </td>
              <td>Page opened from the e-mail link.</td>
            </tr>
            <tr>
              <td>
                <code>VerifyEmail</code>
              </td>
              <td>
                <code>uid, token, loginTo</code>
              </td>
              <td>Confirms the address on display (StrictMode-safe).</td>
            </tr>
            <tr>
              <td>
                <code>ProfileForm</code>
              </td>
              <td>—</td>
              <td>First / last name.</td>
            </tr>
            <tr>
              <td>
                <code>ChangePasswordForm</code>
              </td>
              <td>—</td>
              <td>Current + new password.</td>
            </tr>
            <tr>
              <td>
                <code>TwoFactorSettings</code>
              </td>
              <td>—</td>
              <td>Enable TOTP (QR code) or e-mail codes, disable with password.</td>
            </tr>
            <tr>
              <td>
                <code>DeleteAccountForm</code>
              </td>
              <td>
                <code>onDeleted</code>
              </td>
              <td>Self-service account deletion.</td>
            </tr>
            <tr>
              <td>
                <code>UserMenu</code>
              </td>
              <td>
                <code>profileTo, loginTo, onLogout</code>
              </td>
              <td>Avatar + name + sign-out for the header.</td>
            </tr>
            <tr>
              <td>
                <code>UserManagement</code>
              </td>
              <td>—</td>
              <td>Staff screen: search, paginate, create, edit, delete users.</td>
            </tr>
          </tbody>
        </table>
      </Section>
    </article>
  );
}
