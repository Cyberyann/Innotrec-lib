import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RequireAuth } from '../../auth/RequireAuth';
import { callsTo, mockFetch, renderWithProviders, testUser } from '../../test/utils';
import { ChangePasswordForm, DeleteAccountForm } from './AccountForms';
import { LoginForm } from './LoginForm';
import { PasswordResetConfirmForm, PasswordResetRequestForm } from './PasswordResetForms';
import { RegisterForm } from './RegisterForm';
import { TwoFactorSettings } from './TwoFactorSettings';
import { UserMenu } from './UserMenu';
import { VerifyEmail } from './VerifyEmail';

const loggedIn = { 'GET /auth/me/': () => ({ body: testUser }) };

describe('LoginForm', () => {
  it('logs in without 2FA', async () => {
    const onSuccess = vi.fn();
    const fetch = mockFetch({
      'POST /auth/login/': (body) => {
        expect(body).toEqual({ email: 'alice@example.com', password: 'secret-pass' });
        return { body: { status: 'authenticated', user: testUser } };
      },
    });
    renderWithProviders(
      <LoginForm onSuccess={onSuccess} forgotPasswordTo="/forgot" registerTo="/register" />,
      { fetch },
    );
    await userEvent.type(screen.getByLabelText(/E-mail/), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/^Password/), 'secret-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(testUser));
    expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute(
      'href',
      '/forgot',
    );
  });

  it('shows the API error', async () => {
    const fetch = mockFetch({
      'POST /auth/login/': () => ({
        status: 400,
        body: { detail: 'Invalid e-mail or password.', code: 'invalid_credentials' },
      }),
    });
    renderWithProviders(<LoginForm />, { fetch });
    await userEvent.type(screen.getByLabelText(/E-mail/), 'a@b.c');
    await userEvent.type(screen.getByLabelText(/^Password/), 'bad');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid e-mail or password.');
  });

  it('offers to resend the verification e-mail', async () => {
    const fetch = mockFetch({
      'POST /auth/login/': () => ({
        status: 403,
        body: { detail: 'not verified', code: 'email_not_verified' },
      }),
      'POST /auth/verify-email/resend/': () => ({ body: { detail: 'ok' } }),
    });
    renderWithProviders(<LoginForm />, { fetch });
    await userEvent.type(screen.getByLabelText(/E-mail/), 'a@b.c');
    await userEvent.type(screen.getByLabelText(/^Password/), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Resend the verification e-mail' }),
    );
    expect(await screen.findByText('Verification e-mail sent.')).toBeInTheDocument();
  });

  it('handles the e-mail 2FA step with resend', async () => {
    const onSuccess = vi.fn();
    const fetch = mockFetch({
      'POST /auth/login/': () => ({ body: { status: '2fa_required', method: 'email' } }),
      'POST /auth/login/2fa/resend/': () => ({ body: { detail: 'sent' } }),
      'POST /auth/login/2fa/': (body) =>
        (body as { code: string }).code === '123456'
          ? { body: { status: 'authenticated', user: testUser } }
          : { status: 400, body: { detail: 'Invalid code.', code: 'invalid_code' } },
    });
    renderWithProviders(<LoginForm onSuccess={onSuccess} />, { fetch });
    await userEvent.type(screen.getByLabelText(/E-mail/), 'a@b.c');
    await userEvent.type(screen.getByLabelText(/^Password/), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText(/sent a 6-digit code/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send a new code' }));
    expect(await screen.findByText('A new code has been sent.')).toBeInTheDocument();

    const codeInput = screen.getByLabelText(/Verification code/);
    await userEvent.type(codeInput, '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText('Invalid code.')).toBeInTheDocument();

    await userEvent.type(codeInput, '12a3456');
    expect(codeInput).toHaveValue('123456');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(testUser));
  });

  it('shows the TOTP help and can go back', async () => {
    const fetch = mockFetch({
      'POST /auth/login/': () => ({ body: { status: '2fa_required', method: 'totp' } }),
    });
    renderWithProviders(<LoginForm />, { fetch });
    await userEvent.type(screen.getByLabelText(/E-mail/), 'a@b.c');
    await userEvent.type(screen.getByLabelText(/^Password/), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/authenticator app/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send a new code' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('is translated in French', () => {
    renderWithProviders(<LoginForm />, { locale: 'fr' });
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });
});

describe('RegisterForm', () => {
  it('validates the confirmation and shows server field errors', async () => {
    const fetch = mockFetch({
      'POST /auth/register/': () => ({
        status: 400,
        body: { email: ['A user with this e-mail already exists.'] },
      }),
    });
    renderWithProviders(<RegisterForm loginTo="/login" />, { fetch });
    await userEvent.type(screen.getByLabelText(/E-mail/), 'a@b.c');
    await userEvent.type(screen.getByLabelText(/^Password/), 'longpassword1');
    await userEvent.type(screen.getByLabelText(/Confirm password/), 'different');
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create my account' })).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/Confirm password/));
    await userEvent.type(screen.getByLabelText(/Confirm password/), 'longpassword1');
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));
    expect(await screen.findByText('A user with this e-mail already exists.')).toBeInTheDocument();
  });

  it('shows a success message', async () => {
    const fetch = mockFetch({ 'POST /auth/register/': () => ({ status: 201, body: testUser }) });
    renderWithProviders(<RegisterForm />, { fetch });
    await userEvent.type(screen.getByLabelText(/E-mail/), 'a@b.c');
    await userEvent.type(screen.getByLabelText(/^Password/), 'pw-long-enough');
    await userEvent.click(screen.getByRole('button', { name: 'Create my account' }));
    expect(await screen.findByText(/Check your e-mail/)).toBeInTheDocument();
  });
});

describe('Password reset', () => {
  it('requests a reset link', async () => {
    const fetch = mockFetch({ 'POST /auth/password/reset/': () => ({ body: { detail: 'ok' } }) });
    renderWithProviders(<PasswordResetRequestForm loginTo="/login" />, { fetch });
    await userEvent.type(screen.getByLabelText(/E-mail/), 'a@b.c');
    await userEvent.click(screen.getByRole('button', { name: 'Send the link' }));
    expect(await screen.findByText(/a reset link has been sent/)).toBeInTheDocument();
  });

  it('confirms with uid/token from the route', async () => {
    const fetch = mockFetch({
      'POST /auth/password/reset/confirm/': (body) => {
        expect(body).toEqual({ uid: 'MQ', token: 'tok', new_password: 'New-passw0rd!' });
        return { body: { detail: 'ok' } };
      },
    });
    renderWithProviders(<PasswordResetConfirmForm uid="MQ" token="tok" />, { fetch });
    await userEvent.type(screen.getByLabelText(/New password/), 'New-passw0rd!');
    await userEvent.type(screen.getByLabelText(/Confirm password/), 'New-passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: 'Change my password' }));
    expect(await screen.findByText(/Your password has been changed/)).toBeInTheDocument();
  });

  it('shows the server password validation errors', async () => {
    const fetch = mockFetch({
      'POST /auth/password/reset/confirm/': () => ({
        status: 400,
        body: { new_password: ['This password is too common.'] },
      }),
    });
    renderWithProviders(<PasswordResetConfirmForm uid="MQ" token="tok" />, { fetch });
    await userEvent.type(screen.getByLabelText(/New password/), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Change my password' }));
    expect(await screen.findByText('This password is too common.')).toBeInTheDocument();
  });
});

describe('VerifyEmail', () => {
  it('verifies once on mount', async () => {
    const fetch = mockFetch({ 'POST /auth/verify-email/': () => ({ body: { detail: 'ok' } }) });
    renderWithProviders(<VerifyEmail uid="u" token="t" loginTo="/login" />, { fetch });
    expect(await screen.findByText(/is verified/)).toBeInTheDocument();
    expect(callsTo(fetch, 'POST', '/auth/verify-email/')).toHaveLength(1);
  });

  it('shows invalid link errors', async () => {
    const fetch = mockFetch({
      'POST /auth/verify-email/': () => ({
        status: 400,
        body: { detail: 'Invalid or expired link.' },
      }),
    });
    renderWithProviders(<VerifyEmail uid="u" token="t" />, { fetch });
    expect(await screen.findByText('Invalid or expired link.')).toBeInTheDocument();
  });
});

describe('RequireAuth / UserMenu', () => {
  it('redirects anonymous users', async () => {
    renderWithProviders(
      <RequireAuth>
        <p>secret</p>
      </RequireAuth>,
    );
    expect(await screen.findByText('other page')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users and blocks non-staff', async () => {
    const fetch = mockFetch(loggedIn);
    renderWithProviders(
      <RequireAuth>
        <p>secret</p>
      </RequireAuth>,
      { fetch },
    );
    expect(await screen.findByText('secret')).toBeInTheDocument();
  });

  it('blocks non-staff users from staff pages', async () => {
    const fetch = mockFetch(loggedIn);
    renderWithProviders(
      <RequireAuth staff forbidden={<p>forbidden</p>}>
        <p>admin</p>
      </RequireAuth>,
      { fetch },
    );
    expect(await screen.findByText('forbidden')).toBeInTheDocument();
  });

  it('shows the user and logs out', async () => {
    const onLogout = vi.fn();
    const fetch = mockFetch({ ...loggedIn, 'POST /auth/logout/': () => ({ status: 204 }) });
    renderWithProviders(<UserMenu onLogout={onLogout} />, { fetch });
    expect(await screen.findByText('Alice Doe')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(onLogout).toHaveBeenCalled());
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('Account settings', () => {
  it('changes the password', async () => {
    const fetch = mockFetch({
      ...loggedIn,
      'POST /auth/password/change/': () => ({ body: { detail: 'ok' } }),
    });
    renderWithProviders(<ChangePasswordForm />, { fetch });
    await userEvent.type(screen.getByLabelText(/Current password/), 'old');
    await userEvent.type(screen.getByLabelText(/New password/), 'Brand-new-1');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Password changed.')).toBeInTheDocument();
  });

  it('enables TOTP with the QR code', async () => {
    const fetch = mockFetch({
      ...loggedIn,
      'POST /auth/2fa/totp/setup/': () => ({
        body: {
          secret: 'ABC',
          otpauth_url: 'otpauth://x',
          qr_code: 'data:image/svg+xml;base64,AA',
        },
      }),
      'POST /auth/2fa/totp/confirm/': () => ({
        body: { ...testUser, two_factor_method: 'totp', two_factor_enabled: true },
      }),
    });
    renderWithProviders(<TwoFactorSettings />, { fetch });
    await userEvent.click(await screen.findByRole('button', { name: 'Use an authenticator app' }));
    expect(screen.getByAltText('QR code')).toHaveAttribute('src', 'data:image/svg+xml;base64,AA');
    expect(screen.getByText(/ABC/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Verification code/), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText('Two-factor authentication enabled.')).toBeInTheDocument();
    expect(screen.getByText(/Current method: authenticator app/)).toBeInTheDocument();
  });

  it('deletes the account', async () => {
    const onDeleted = vi.fn();
    const fetch = mockFetch({
      ...loggedIn,
      'DELETE /auth/me/': (body) => {
        expect(body).toEqual({ password: 'pw' });
        return { status: 204 };
      },
    });
    renderWithProviders(<DeleteAccountForm onDeleted={onDeleted} />, { fetch });
    await userEvent.type(screen.getByLabelText(/Password/), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Delete my account permanently' }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  });
});

describe('RequireAnonymous', () => {
  it('sends logged-in users back to the page saved by RequireAuth', async () => {
    const { RequireAnonymous } = await import('../../auth/RequireAuth');
    const { MemoryRouter, Route, Routes } = await import('react-router');
    const { render } = await import('@testing-library/react');
    const { ApiClient } = await import('../../api/client');
    const { InnotrecProvider } = await import('../../InnotrecProvider');
    const fetch = mockFetch(loggedIn);
    const client = new ApiClient({ fetchImpl: fetch as unknown as typeof globalThis.fetch });
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/login', state: { from: { pathname: '/notes', search: '?page=2' } } },
        ]}
      >
        <InnotrecProvider client={client}>
          <Routes>
            <Route
              path="/login"
              element={
                <RequireAnonymous>
                  <p>login page</p>
                </RequireAnonymous>
              }
            />
            <Route path="/notes" element={<p>notes page</p>} />
          </Routes>
        </InnotrecProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('notes page')).toBeInTheDocument();
  });
});
