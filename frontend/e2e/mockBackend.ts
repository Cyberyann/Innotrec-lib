import type { Page, Route } from '@playwright/test';

export interface MockUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  two_factor_method: 'none' | 'totp' | 'email';
  is_staff: boolean;
  email_verified: boolean;
}

/**
 * In-memory imitation of the Django API, good enough to drive the UI end-to-end.
 * Mirrors the innotrec-auth contract (status codes, payloads, CSRF header check).
 */
export class MockBackend {
  users: MockUser[] = [];
  notes: Array<{
    id: number;
    owner: string;
    title: string;
    content: string;
    category: string;
    created_at: string;
  }> = [];
  session: string | null = null;
  pending2fa: string | null = null;
  lastEmailCode = '424242';
  requests: string[] = [];

  addUser(partial: Partial<MockUser> & { email: string; password: string }): MockUser {
    const user: MockUser = {
      id: String(this.users.length + 1),
      first_name: '',
      last_name: '',
      two_factor_method: 'none',
      is_staff: false,
      email_verified: true,
      ...partial,
    };
    this.users.push(user);
    return user;
  }

  private publicUser(u: MockUser) {
    const { password: _password, ...rest } = u;
    return {
      ...rest,
      full_name: `${u.first_name} ${u.last_name}`.trim(),
      two_factor_enabled: u.two_factor_method !== 'none',
      date_joined: '2026-01-01T00:00:00Z',
    };
  }

  private current() {
    return this.users.find((u) => u.id === this.session) ?? null;
  }

  async install(page: Page) {
    // only the API root — not Vite modules such as /src/api/notes.ts
    await page.route(
      (url) => url.pathname.startsWith('/api/'),
      (route) => this.handle(route),
    );
  }

  private async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();
    const body = request.postData() ? JSON.parse(request.postData()!) : {};
    this.requests.push(`${method} ${path}`);
    const json = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: status === 204 ? '' : JSON.stringify(data),
        headers: path === '/auth/csrf/' ? { 'set-cookie': 'csrftoken=e2e-token; Path=/' } : {},
      });

    if (!['GET', 'HEAD'].includes(method) && request.headers()['x-csrftoken'] !== 'e2e-token') {
      return json({ detail: 'CSRF Failed: CSRF token missing.' }, 403);
    }
    const me = this.current();

    switch (`${method} ${path}`) {
      case 'GET /auth/csrf/':
        return json({ csrfToken: 'e2e-token' });
      case 'GET /auth/me/':
        return me
          ? json(this.publicUser(me))
          : json({ detail: 'Authentication credentials were not provided.' }, 403);
      case 'POST /auth/login/': {
        const user = this.users.find((u) => u.email === body.email && u.password === body.password);
        if (!user)
          return json({ detail: 'Invalid e-mail or password.', code: 'invalid_credentials' }, 400);
        if (!user.email_verified)
          return json({ detail: 'E-mail address not verified.', code: 'email_not_verified' }, 403);
        if (user.two_factor_method !== 'none') {
          this.pending2fa = user.id;
          return json({ status: '2fa_required', method: user.two_factor_method });
        }
        this.session = user.id;
        return json({ status: 'authenticated', user: this.publicUser(user) });
      }
      case 'POST /auth/login/2fa/': {
        const user = this.users.find((u) => u.id === this.pending2fa);
        if (!user)
          return json(
            { detail: 'No pending login or login expired.', code: 'no_pending_login' },
            400,
          );
        if (body.code !== this.lastEmailCode)
          return json({ detail: 'Invalid code.', code: 'invalid_code' }, 400);
        this.session = user.id;
        this.pending2fa = null;
        return json({ status: 'authenticated', user: this.publicUser(user) });
      }
      case 'POST /auth/logout/':
        this.session = null;
        return json(null, 204);
      case 'POST /auth/register/': {
        if (this.users.some((u) => u.email === body.email))
          return json({ email: ['A user with this e-mail already exists.'] }, 400);
        if (String(body.password).length < 10)
          return json(
            { password: ['This password is too short. It must contain at least 10 characters.'] },
            400,
          );
        const user = this.addUser({ ...body, email_verified: false });
        return json(this.publicUser(user), 201);
      }
      case 'POST /auth/verify-email/': {
        const user = this.users.find((u) => u.id === body.uid);
        if (!user || body.token !== 'valid-token')
          return json({ detail: 'Invalid or expired link.', code: 'invalid_token' }, 400);
        user.email_verified = true;
        return json({ detail: 'E-mail address verified.' });
      }
      case 'POST /auth/password/reset/':
        return json({
          detail: 'If an account matches this e-mail address, a message has been sent.',
        });
      case 'POST /auth/password/reset/confirm/': {
        const user = this.users.find((u) => u.id === body.uid);
        if (!user || body.token !== 'valid-token')
          return json({ detail: 'Invalid or expired link.', code: 'invalid_token' }, 400);
        user.password = body.new_password;
        return json({ detail: 'Password has been reset.' });
      }
      case 'POST /auth/2fa/email/setup/':
        return json({ detail: 'A code has been sent to your e-mail address.' });
      case 'POST /auth/2fa/email/confirm/':
        if (!me) return json({}, 403);
        if (body.code !== this.lastEmailCode)
          return json({ detail: 'Invalid code.', code: 'invalid_code' }, 400);
        me.two_factor_method = 'email';
        return json(this.publicUser(me));
      case 'GET /notes/stats/':
        return json([
          { label: 'Work', value: this.notes.filter((n) => n.category === 'work').length },
          { label: 'Personal', value: this.notes.filter((n) => n.category === 'personal').length },
          { label: 'Idea', value: this.notes.filter((n) => n.category === 'idea').length },
        ]);
      case 'GET /notes/': {
        const results = this.notes.filter((n) => n.owner === me?.id);
        return json({ count: results.length, next: null, previous: null, results });
      }
      case 'POST /notes/': {
        const note = {
          id: this.notes.length + 1,
          owner: me!.id,
          content: '',
          category: 'work',
          created_at: new Date().toISOString(),
          ...body,
        };
        this.notes.push(note);
        return json(note, 201);
      }
      case 'GET /auth/users/':
        if (!me?.is_staff) return json({ detail: 'Administrator permission required.' }, 403);
        return json({
          count: this.users.length,
          next: null,
          previous: null,
          results: this.users.map((u) => this.publicUser(u)),
        });
      default:
        return json({ detail: `Mock: no route for ${method} ${path}` }, 404);
    }
  }
}
