import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createAuthApi, type AuthApi } from '../api/authApi';
import { ApiClient, ApiError } from '../api/client';
import type { LoginResult, User } from '../api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  /** Low-level HTTP client (CSRF + cookies handled) — use it for your own endpoints. */
  client: ApiClient;
  /** Typed wrapper of every auth endpoint. */
  api: AuthApi;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (code: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Reload the current user from the server. */
  refresh: () => Promise<User | null>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  /** Shared client. Defaults to `new ApiClient({ baseUrl: apiBaseUrl })`. */
  client?: ApiClient;
  /** API root when no client is given (default `/api`). */
  apiBaseUrl?: string;
  /** Path prefix of the innotrec-auth routes inside the API (default `/auth`). */
  authPrefix?: string;
  children: ReactNode;
}

export function AuthProvider({
  client: providedClient,
  apiBaseUrl,
  authPrefix = '/auth',
  children,
}: AuthProviderProps) {
  const client = useMemo(
    () => providedClient ?? new ApiClient({ baseUrl: apiBaseUrl }),
    [providedClient, apiBaseUrl],
  );
  const api = useMemo(() => createAuthApi(client, authPrefix), [client, authPrefix]);
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
    setStatus(next ? 'authenticated' : 'anonymous');
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setUser(null);
        return null;
      }
      setUser(null);
      throw error;
    }
  }, [api, setUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await client.ensureCsrf();
      } catch {
        /* the next unsafe request will retry */
      }
      if (!cancelled) await refresh().catch(() => undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [client, refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.login(email, password);
      if (result.status === 'authenticated') setUser(result.user);
      return result;
    },
    [api, setUser],
  );

  const verifyTwoFactor = useCallback(
    async (code: string) => {
      const result = await api.loginTwoFactor(code);
      if (result.status !== 'authenticated') throw new Error('Unexpected 2FA response');
      setUser(result.user);
      return result.user;
    },
    [api, setUser],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      await client.ensureCsrf(true).catch(() => undefined);
    }
  }, [api, client, setUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, client, api, login, verifyTwoFactor, logout, refresh, setUser }),
    [user, status, client, api, login, verifyTwoFactor, logout, refresh, setUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider> / <InnotrecProvider>.');
  return ctx;
}
