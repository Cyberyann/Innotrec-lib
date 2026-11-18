import { ApiClient, InnotrecProvider } from '@innotrec/ui';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

const user = {
  id: '1',
  email: 'alice@example.com',
  first_name: 'Alice',
  last_name: '',
  full_name: 'Alice',
  email_verified: true,
  two_factor_method: 'none',
  two_factor_enabled: false,
  is_staff: false,
  date_joined: '2026-01-01T00:00:00Z',
};

function fakeBackend(loggedIn: boolean) {
  const notes = [
    {
      id: 1,
      title: 'First note',
      content: '',
      category: 'idea',
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '',
    },
  ];
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input), 'http://x').pathname;
    const method = init?.method ?? 'GET';
    const json = (body: unknown, status = 200) =>
      new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    if (path === '/api/auth/csrf/') return json({ csrfToken: 'x' });
    if (path === '/api/auth/me/') return loggedIn ? json(user) : json({ detail: 'no' }, 403);
    if (path === '/api/notes/stats/')
      return json([
        { label: 'Work', value: 0 },
        { label: 'Idea', value: 1 },
      ]);
    if (path === '/api/notes/' && method === 'GET')
      return json({ count: notes.length, next: null, previous: null, results: notes });
    if (path === '/api/notes/' && method === 'POST') {
      const body = JSON.parse(String(init?.body));
      notes.push({ id: 2, created_at: '2026-01-02T10:00:00Z', updated_at: '', ...body });
      return json(notes.at(-1), 201);
    }
    return json({ detail: 'Not found' }, 404);
  });
}

function renderApp(route: string, loggedIn: boolean) {
  const fetch = fakeBackend(loggedIn);
  const client = new ApiClient({ fetchImpl: fetch as unknown as typeof globalThis.fetch });
  render(
    <MemoryRouter initialEntries={[route]}>
      <InnotrecProvider client={client}>
        <App />
      </InnotrecProvider>
    </MemoryRouter>,
  );
  return fetch;
}

describe('App', () => {
  it('redirects anonymous visitors to the login page', async () => {
    renderApp('/notes', false);
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the dashboard chart for logged-in users', async () => {
    renderApp('/', true);
    expect(await screen.findByRole('heading', { name: /Hello Alice/ })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Notes per category' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('creates a note', async () => {
    renderApp('/notes', true);
    expect(await screen.findByText('First note')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'New note' }));
    await userEvent.type(screen.getByLabelText(/Title/), 'Second note');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Second note')).toBeInTheDocument());
  });

  it('renders a 404 page', async () => {
    renderApp('/nope', true);
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
