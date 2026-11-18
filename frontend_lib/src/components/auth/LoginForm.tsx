import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { User } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useApiForm } from '../../auth/useApiForm';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Input } from '../Input';

export interface LoginFormProps {
  onSuccess?: (user: User) => void;
  /** Route of the "forgot password" page; hidden when undefined. */
  forgotPasswordTo?: string;
  /** Route of the registration page; hidden when undefined. */
  registerTo?: string;
  title?: ReactNode;
}

type Step = { kind: 'credentials' } | { kind: '2fa'; method: 'totp' | 'email' };

/** Complete login flow: e-mail + password, then TOTP or e-mail code when 2FA is enabled. */
export function LoginForm({ onSuccess, forgotPasswordTo, registerTo, title }: LoginFormProps) {
  const { t } = useI18n();
  const { login, verifyTwoFactor, api } = useAuth();
  const form = useApiForm();
  const [step, setStep] = useState<Step>({ kind: 'credentials' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    setInfo(null);
    const result = await form.run(() => login(email, password));
    if (!result) return;
    if (result.status === 'authenticated') {
      setPassword('');
      onSuccess?.(result.user);
    } else {
      setStep({ kind: '2fa', method: result.method });
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setInfo(null);
    const user = await form.run(() => verifyTwoFactor(code));
    if (user) {
      setPassword('');
      onSuccess?.(user);
    } else {
      setCode('');
    }
  };

  const resendCode = async () => {
    const ok = await form.run(() => api.resendLoginCode());
    if (ok) setInfo(t('twofa.resent'));
  };

  const resendVerification = async () => {
    const ok = await form.run(() => api.resendVerification(email));
    if (ok) setInfo(t('login.verificationSent'));
  };

  if (step.kind === '2fa') {
    return (
      <form className="iu-form" onSubmit={submitCode} noValidate aria-label={t('twofa.title')}>
        <h1 className="iu-form__title">{t('twofa.title')}</h1>
        <p>{step.method === 'totp' ? t('twofa.totpHelp') : t('twofa.emailHelp')}</p>
        {form.error && <Alert variant="error">{form.error}</Alert>}
        {info && <Alert variant="success">{info}</Alert>}
        <Input
          label={t('twofa.code')}
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          required
          autoFocus
          error={form.fieldError('code')}
        />
        <Button type="submit" fullWidth loading={form.submitting} disabled={code.length < 6}>
          {t('twofa.verify')}
        </Button>
        <div className="iu-form__links">
          {step.method === 'email' && (
            <Button variant="link" onClick={resendCode} disabled={form.submitting}>
              {t('twofa.resend')}
            </Button>
          )}
          <Button
            variant="link"
            onClick={() => {
              form.reset();
              setCode('');
              setStep({ kind: 'credentials' });
            }}
          >
            {t('twofa.back')}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form className="iu-form" onSubmit={submitCredentials} noValidate aria-label={t('login.title')}>
      <h1 className="iu-form__title">{title ?? t('login.title')}</h1>
      {form.error && (
        <Alert variant="error">
          {form.errorCode === 'email_not_verified' ? t('login.notVerified') : form.error}
          {form.errorCode === 'email_not_verified' && (
            <>
              {' '}
              <Button variant="link" onClick={resendVerification}>
                {t('login.resendVerification')}
              </Button>
            </>
          )}
        </Alert>
      )}
      {info && <Alert variant="success">{info}</Alert>}
      <Input
        label={t('common.email')}
        type="email"
        name="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        error={form.fieldError('email')}
      />
      <Input
        label={t('common.password')}
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        error={form.fieldError('password')}
      />
      <Button type="submit" fullWidth loading={form.submitting} disabled={!email || !password}>
        {t('login.submit')}
      </Button>
      {(forgotPasswordTo || registerTo) && (
        <div className="iu-form__links">
          {forgotPasswordTo && <Link to={forgotPasswordTo}>{t('login.forgot')}</Link>}
          {registerTo && <Link to={registerTo}>{t('login.register')}</Link>}
        </div>
      )}
    </form>
  );
}
