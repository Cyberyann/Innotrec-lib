import { describe, expect, it, vi } from 'vitest';
import { mockFetch } from '../test/utils';
import { ApiClient, ApiError } from './client';

describe('ApiClient', () => {
  it('builds urls with query params', () => {
    const client = new ApiClient({ baseUrl: '/api/' });
    expect(client.url('/notes/', { page: 2, search: '', x: undefined })).toBe('/api/notes/?page=2');
  });

  it('fetches the CSRF cookie before an unsafe request and sends it as header', async () => {
    const fetch = mockFetch({ 'POST /notes/': () => ({ status: 201, body: { id: 1 } }) });
    const client = new ApiClient({ fetchImpl: fetch as unknown as typeof globalThis.fetch });
    const result = await client.post<{ id: number }>('/notes/', { title: 'x' });
    expect(result).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledTimes(2);
    const [, init] = fetch.mock.calls[1]!;
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).get('X-CSRFToken')).toBe('test-csrf');
    expect(init.body).toBe('{"title":"x"}');
  });

  it('does not send a CSRF header on GET', async () => {
    const fetch = mockFetch({ 'GET /notes/': () => ({ body: [] }) });
    const client = new ApiClient({ fetchImpl: fetch as unknown as typeof globalThis.fetch });
    await client.get('/notes/');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(new Headers(fetch.mock.calls[0]![1].headers).has('X-CSRFToken')).toBe(false);
  });

  it('turns DRF errors into ApiError with field errors and code', async () => {
    const fetch = mockFetch({
      'POST /x/': () => ({ status: 400, body: { email: ['Invalid e-mail.'], code: 'bad' } }),
    });
    const client = new ApiClient({ fetchImpl: fetch as unknown as typeof globalThis.fetch });
    const error = await client.post('/x/', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors).toEqual({ email: ['Invalid e-mail.'] });
    expect((error as ApiError).code).toBe('bad');
    expect((error as ApiError).status).toBe(400);
  });

  it('uses detail as message and calls onUnauthorized on 403', async () => {
    const onUnauthorized = vi.fn();
    const fetch = mockFetch({ 'GET /secret/': () => ({ status: 403, body: { detail: 'Nope' } }) });
    const client = new ApiClient({
      fetchImpl: fetch as unknown as typeof globalThis.fetch,
      onUnauthorized,
    });
    await expect(client.get('/secret/')).rejects.toThrow('Nope');
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('returns undefined on 204 and maps 429 / network errors', async () => {
    const fetch = mockFetch({
      'DELETE /a/': () => ({ status: 204 }),
      'GET /b/': () => ({ status: 429, body: {} }),
    });
    const client = new ApiClient({ fetchImpl: fetch as unknown as typeof globalThis.fetch });
    await expect(client.delete('/a/')).resolves.toBeUndefined();
    await expect(client.get('/b/')).rejects.toThrow(/Too many requests/);
    const broken = new ApiClient({ fetchImpl: () => Promise.reject(new TypeError('offline')) });
    await expect(broken.get('/c/')).rejects.toMatchObject({ status: 0 });
  });
});
