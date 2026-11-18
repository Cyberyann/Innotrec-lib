import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '../components/Spinner';
import { useAuth } from './AuthContext';

export interface RequireAuthProps {
  children: ReactNode;
  /** Where anonymous users are sent (default `/login`). The original location is kept in `state.from`. */
  redirectTo?: string;
  /** Only allow staff members. */
  staff?: boolean;
  /** Rendered for authenticated users lacking permission (default: redirect to `/`). */
  forbidden?: ReactNode;
  loading?: ReactNode;
}

export function RequireAuth({
  children,
  redirectTo = '/login',
  staff = false,
  forbidden,
  loading,
}: RequireAuthProps) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <>{loading ?? <Spinner center />}</>;
  if (status === 'anonymous' || !user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  if (staff && !user.is_staff) return <>{forbidden ?? <Navigate to="/" replace />}</>;
  return <>{children}</>;
}

/**
 * Inverse guard: send already logged-in users away from the login / register pages.
 * After a successful login they go back to the page `RequireAuth` saved in `state.from`.
 */
export function RequireAnonymous({
  children,
  redirectTo = '/',
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Spinner center />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    const target = from?.pathname ? `${from.pathname}${from.search ?? ''}` : redirectTo;
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}
