import {
  LoginForm,
  PasswordResetConfirmForm,
  PasswordResetRequestForm,
  RegisterForm,
  VerifyEmail,
} from '@innotrec/ui';
import { useLocation, useNavigate, useParams } from 'react-router';
import { config } from '../config';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
  return (
    <LoginForm
      forgotPasswordTo="/forgot-password"
      registerTo="/register"
      onSuccess={() => navigate(from, { replace: true })}
    />
  );
}

export function RegisterPage() {
  return (
    <RegisterForm loginTo="/login" requireEmailVerification={config.requireEmailVerification} />
  );
}

export function ForgotPasswordPage() {
  return <PasswordResetRequestForm loginTo="/login" />;
}

export function ResetPasswordPage() {
  const { uid = '', token = '' } = useParams();
  return <PasswordResetConfirmForm uid={uid} token={token} loginTo="/login" />;
}

export function VerifyEmailPage() {
  const { uid = '', token = '' } = useParams();
  return <VerifyEmail uid={uid} token={token} loginTo="/login" />;
}
