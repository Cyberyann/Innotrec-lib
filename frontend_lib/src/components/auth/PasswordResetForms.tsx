import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { useApiForm } from '../../auth/useApiForm';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Input } from '../Input';

export interface PasswordResetRequestFormProps {
  loginTo?: string;
}

/** Step 1: ask for the e-mail address; the backend sends a link to the front-end. */
export function PasswordResetRequestForm({ loginTo }: PasswordResetRequestFormProps) {
  const { t } = useI18n();
  const { api } = useAuth();
  const form = useApiForm();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await form.run(() => api.requestPasswordReset(email))) setSent(true);
  };

  return (
    <form className="iu-form" onSubmit={submit} noValidate aria-label={t('reset.title')}>
      <h1 className="iu-form__title">{t('reset.title')}</h1>
      {sent ? (
        <Alert variant="success">{t('reset.sent')}</Alert>
      ) : (
        <>
          <p>{t('reset.help')}</p>
          {form.error && <Alert variant="error">{form.error}</Alert>}
          <Input
            label={t('common.email')}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={form.fieldError('email')}
          />
          <Button type="submit" fullWidth loading={form.submitting} disabled={!email}>
            {t('reset.submit')}
          </Button>
        </>
      )}
      {loginTo && (
        <div className="iu-form__links">
          <Link to={loginTo}>{t('twofa.back')}</Link>
        </div>
      )}
    </form>
  );
}

export interface PasswordResetConfirmFormProps {
  /** From the e-mail link (`/reset-password/:uid/:token`). */
  uid: string;
  token: string;
  loginTo?: string;
  onSuccess?: () => void;
}

/** Step 2: choose a new password using the uid/token of the e-mail link. */
export function PasswordResetConfirmForm({
  uid,
  token,
  loginTo,
  onSuccess,
}: PasswordResetConfirmFormProps) {
  const { t } = useI18n();
  const { api } = useAuth();
  const form = useApiForm();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const mismatch = confirm.length > 0 && password !== confirm;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mismatch) return;
    if (await form.run(() => api.confirmPasswordReset(uid, token, password))) {
      setDone(true);
      onSuccess?.();
    }
  };

  return (
    <form className="iu-form" onSubmit={submit} noValidate aria-label={t('reset.title')}>
      <h1 className="iu-form__title">{t('reset.title')}</h1>
      {done ? (
        <Alert variant="success">{t('reset.done')}</Alert>
      ) : (
        <>
          {form.error && <Alert variant="error">{form.error}</Alert>}
          <Input
            label={t('reset.newPassword')}
            type="password"
            name="new_password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={form.fieldError('new_password')}
          />
          <Input
            label={t('register.passwordConfirm')}
            type="password"
            name="confirm"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={mismatch ? t('register.mismatch') : undefined}
          />
          <Button
            type="submit"
            fullWidth
            loading={form.submitting}
            disabled={!password || mismatch}
          >
            {t('reset.confirmSubmit')}
          </Button>
        </>
      )}
      {loginTo && (
        <div className="iu-form__links">
          <Link to={loginTo}>{t('twofa.back')}</Link>
        </div>
      )}
    </form>
  );
}
