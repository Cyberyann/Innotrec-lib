import { ApiClient, InnotrecProvider } from '@innotrec/ui';
import { useMemo, type ReactNode } from 'react';

/**
 * Fake backend so authentication components can be tried inside the documentation.
 * Accepted credentials: demo@example.com / demo-password — 2FA code: 123456
 */
function demoFetch(twoFactor: boolean): typeof fetch {
  let logged = false;
  const user = {
    id: 'demo',
    email: 'demo@example.com',
    first_name: 'Demo',
    last_name: 'User',
    full_name: 'Demo User',
    email_verified: true,
    two_factor_method: twoFactor ? 'email' : 'none',
    two_factor_enabled: twoFactor,
    is_staff: true,
    date_joined: '2026-01-01T00:00:00Z',
  };
  return async (input, init) => {
    const path = new URL(String(input), 'http://demo').pathname.replace(/^\/api/, '');
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const json = (data: unknown, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    await new Promise((r) => setTimeout(r, 350));
    switch (`${method} ${path}`) {
      case 'GET /auth/csrf/':
        return json({ csrfToken: 'demo' });
      case 'GET /auth/me/':
        return logged ? json(user) : json({ detail: 'Not authenticated' }, 403);
      case 'POST /auth/login/':
        if (body.email !== 'demo@example.com' || body.password !== 'demo-password')
          return json({ detail: 'Invalid e-mail or password.', code: 'invalid_credentials' }, 400);
        if (twoFactor) return json({ status: '2fa_required', method: 'email' });
        logged = true;
        return json({ status: 'authenticated', user });
      case 'POST /auth/login/2fa/':
        if (body.code !== '123456')
          return json({ detail: 'Invalid code.', code: 'invalid_code' }, 400);
        logged = true;
        return json({ status: 'authenticated', user });
      case 'POST /auth/login/2fa/resend/':
        return json({ detail: 'A new code has been sent.' });
      case 'POST /auth/register/':
        return String(body.password).length < 10
          ? json(
              { password: ['This password is too short. It must contain at least 10 characters.'] },
              400,
            )
          : json({ ...user, email: body.email }, 201);
      case 'POST /auth/password/reset/':
        return json({ detail: 'sent' });
      default:
        return json({ detail: `Demo: ${method} ${path} is not simulated.` }, 404);
    }
  };
}

export function DemoProvider({
  children,
  twoFactor = false,
  locale,
}: {
  children: ReactNode;
  twoFactor?: boolean;
  locale?: string;
}) {
  const client = useMemo(() => new ApiClient({ fetchImpl: demoFetch(twoFactor) }), [twoFactor]);
  return (
    <InnotrecProvider client={client} locale={locale}>
      {children}
    </InnotrecProvider>
  );
}
