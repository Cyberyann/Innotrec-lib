import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi, type Mock } from 'vitest';
import { ApiClient } from '../api/client';
import type { User } from '../api/types';
import { InnotrecProvider } from '../InnotrecProvider';

export type Handler = (body: unknown, url: URL) => { status?: number; body?: unknown };
export type Routes_ = Record<string, Handler>;

export const testUser: User = {
  id: '1',
  email: 'alice@example.com',
  first_name: 'Alice',
  last_name: 'Doe',
  full_name: 'Alice Doe',
  email_verified: true,
  two_factor_method: 'none',
  two_factor_enabled: false,
  is_staff: false,
  date_joined: '2026-01-01T00:00:00Z',
};

/**
 * Fake backend: keys are "METHOD /path" (path without the /api prefix and query).
 * Unknown routes answer 404. `/auth/csrf/` and `/auth/me/` (anonymous) have defaults.
 */
export function mockFetch(routes: Routes_ = {}): Mock {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api/, '');
    const key = `${method} ${path}`;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const defaults: Routes_ = {
      'GET /auth/csrf/': () => {
        document.cookie = 'csrftoken=test-csrf; path=/';
        return { body: { csrfToken: 'test-csrf' } };
      },
      'GET /auth/me/': () => ({ status: 403, body: { detail: 'Not authenticated.' } }),
    };
    const handler = routes[key] ?? defaults[key];
    const result = handler ? handler(body, url) : { status: 404, body: { detail: 'Not found.' } };
    const status = result.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(result.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    fetch = mockFetch(),
    path = '/',
    route = '/',
    locale = 'en',
  }: { fetch?: Mock; path?: string; route?: string; locale?: string } = {},
): RenderResult & { fetch: Mock; client: ApiClient } {
  const client = new ApiClient({
    baseUrl: '/api',
    fetchImpl: fetch as unknown as typeof globalThis.fetch,
  });
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <InnotrecProvider client={client} locale={locale}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<div>other page</div>} />
        </Routes>
      </InnotrecProvider>
    </MemoryRouter>,
  );
  return { ...result, fetch, client };
}

export function callsTo(fetch: Mock, method: string, path: string) {
  return fetch.mock.calls.filter(
    ([input, init]) =>
      (init?.method ?? 'GET').toUpperCase() === method && String(input).includes(path),
  );
}
