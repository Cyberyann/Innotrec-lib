/**
 * Fetch wrapper shared by every Innotrec application.
 *
 * - sends cookies (`credentials: 'include'`) — the session cookie is HttpOnly
 * - fetches the CSRF cookie once and sends it back in the `X-CSRFToken` header
 * - converts DRF errors into a typed `ApiError`
 */

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly fieldErrors: FieldErrors;
  readonly data: unknown;

  constructor(status: number, data: unknown) {
    const body = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
    const detail = typeof body.detail === 'string' ? body.detail : undefined;
    const fieldErrors: FieldErrors = {};
    for (const [key, value] of Object.entries(body)) {
      if (key === 'detail' || key === 'code') continue;
      if (Array.isArray(value)) fieldErrors[key] = value.map(String);
      else if (typeof value === 'string') fieldErrors[key] = [value];
    }
    const nonField = fieldErrors.non_field_errors?.join(' ');
    super(detail ?? nonField ?? ApiError.defaultMessage(status));
    this.name = 'ApiError';
    this.status = status;
    this.code = typeof body.code === 'string' ? body.code : undefined;
    this.fieldErrors = fieldErrors;
    this.data = data;
  }

  static defaultMessage(status: number): string {
    if (status === 0) return 'Network error, please try again.';
    if (status === 403) return 'You are not allowed to perform this action.';
    if (status === 404) return 'Not found.';
    if (status === 429) return 'Too many requests, please wait a moment.';
    if (status >= 500) return 'Server error, please try again later.';
    return 'Request failed.';
  }
}

export interface ApiClientOptions {
  /** API root, e.g. `/api` (same origin, recommended) or `https://api.example.com/api`. */
  baseUrl?: string;
  csrfCookieName?: string;
  csrfHeaderName?: string;
  /** Path of the endpoint that sets the CSRF cookie, relative to baseUrl. */
  csrfPath?: string;
  /** Called on every 401/403 from an authenticated call (e.g. to redirect to login). */
  onUnauthorized?: (error: ApiError) => void;
  fetchImpl?: typeof fetch;
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) return decodeURIComponent(cookie.slice(prefix.length));
  }
  return null;
}

export class ApiClient {
  readonly baseUrl: string;
  private readonly csrfCookieName: string;
  private readonly csrfHeaderName: string;
  private readonly csrfPath: string;
  private readonly onUnauthorized?: (error: ApiError) => void;
  private readonly fetchImpl: typeof fetch;
  private csrfToken: string | null = null;
  private csrfPromise: Promise<string> | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? '/api').replace(/\/$/, '');
    this.csrfCookieName = options.csrfCookieName ?? 'csrftoken';
    this.csrfHeaderName = options.csrfHeaderName ?? 'X-CSRFToken';
    this.csrfPath = options.csrfPath ?? '/auth/csrf/';
    this.onUnauthorized = options.onUnauthorized;
    this.fetchImpl = options.fetchImpl ?? ((...args) => globalThis.fetch(...args));
  }

  url(path: string, query?: RequestOptions['query']): string {
    const full = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    if (!query) return full;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${full}?${qs}` : full;
  }

  /** Ensure the CSRF cookie exists and return its value. */
  async ensureCsrf(force = false): Promise<string> {
    const fromCookie = readCookie(this.csrfCookieName);
    if (fromCookie && !force) return fromCookie;
    if (this.csrfToken && !force) return this.csrfToken;
    if (!this.csrfPromise || force) {
      this.csrfPromise = this.fetchImpl(this.url(this.csrfPath), {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as { csrfToken?: string };
          this.csrfToken = readCookie(this.csrfCookieName) ?? data.csrfToken ?? '';
          return this.csrfToken;
        })
        .finally(() => {
          this.csrfPromise = null;
        });
    }
    return this.csrfPromise;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, query, headers, ...rest } = options;
    const method = (rest.method ?? 'GET').toUpperCase();
    const finalHeaders = new Headers(headers);
    finalHeaders.set('Accept', 'application/json');
    if (body !== undefined) finalHeaders.set('Content-Type', 'application/json');
    if (!SAFE_METHODS.has(method)) {
      // Prefer the cookie: Django rotates the token at login.
      const token = readCookie(this.csrfCookieName) ?? (await this.ensureCsrf());
      if (token) finalHeaders.set(this.csrfHeaderName, token);
    }

    let response: Response;
    try {
      response = await this.fetchImpl(this.url(path, query), {
        ...rest,
        method,
        headers: finalHeaders,
        credentials: 'include',
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, { detail: ApiError.defaultMessage(0) });
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }
    }
    if (!response.ok) {
      const error = new ApiError(response.status, data);
      if ((response.status === 401 || response.status === 403) && this.onUnauthorized) {
        this.onUnauthorized(error);
      }
      throw error;
    }
    return data as T;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }
  delete<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE', body });
  }
}
