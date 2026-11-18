import {
  AppLayout,
  Footer,
  Header,
  RequireAnonymous,
  RequireAuth,
  useAuth,
  UserMenu,
  type MenuItem,
} from '@innotrec/ui';
import { Route, Routes, useNavigate } from 'react-router';
import { config } from './config';
import { AdminUsersPage } from './pages/AdminUsersPage';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { NotesPage } from './pages/NotesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const items: MenuItem[] = user
    ? [
        { label: 'Dashboard', to: '/' },
        { label: 'Notes', to: '/notes' },
        { label: 'Users', to: '/admin/users', hidden: !user.is_staff },
      ]
    : [];

  return (
    <AppLayout
      header={
        <Header
          title={config.appName}
          logoSrc="/logo.svg"
          items={items}
          actions={<UserMenu onLogout={() => navigate('/login')} />}
        />
      }
      footer={<Footer owner="Innotrec" links={[{ label: 'Documentation', href: '/doc/' }]} />}
    >
      <Routes>
        {/* public pages */}
        <Route
          path="/login"
          element={
            <RequireAnonymous>
              <LoginPage />
            </RequireAnonymous>
          }
        />
        <Route
          path="/register"
          element={
            <RequireAnonymous>
              <RegisterPage />
            </RequireAnonymous>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* links received by e-mail — paths match INNOTREC_AUTH PASSWORD_RESET_PATH / VERIFY_EMAIL_PATH */}
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />

        {/* authenticated pages */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/notes"
          element={
            <RequireAuth>
              <NotesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth staff>
              <AdminUsersPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}
