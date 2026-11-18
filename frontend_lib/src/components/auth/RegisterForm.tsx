import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { User } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useApiForm } from '../../auth/useApiForm';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Input } from '../Input';

export interface RegisterFormProps {
  onSuccess?: (user: User) => void;
  loginTo?: string;
  /** Must match the backend `REQUIRE_EMAIL_VERIFICATION` (only changes the success message). */
  requireEmailVerification?: boolean;
}

export function RegisterForm({
  onSuccess,
  loginTo,
  requireEmailVerification = true,
}: RegisterFormProps) {
  const { t } = useI18n();
  const { api } = useAuth();
  const form = useApiForm();
  const [values, setValues] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm: '',
  });
  const [done, setDone] = useState(false);
  const mismatch = values.confirm.length > 0 && values.password !== values.confirm;

  const set = (name: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mismatch) return;
    const { confirm: _confirm, ...input } = values;
    const user = await form.run(() => api.register(input));
    if (user) {
      setDone(true);
      onSuccess?.(user);
    }
  };

  if (done) {
    return (
      <div className="iu-form">
        <h1 className="iu-form__title">{t('register.title')}</h1>
        <Alert variant="success">
          {requireEmailVerification ? t('register.success') : t('register.successNoVerify')}
        </Alert>
        {loginTo && <Link to={loginTo}>{t('register.haveAccount')}</Link>}
      </div>
    );
  }

  return (
    <form className="iu-form" onSubmit={submit} noValidate aria-label={t('register.title')}>
      <h1 className="iu-form__title">{t('register.title')}</h1>
      {form.error && <Alert variant="error">{form.error}</Alert>}
      <div className="iu-grid-2">
        <Input
          label={t('common.firstName')}
          name="first_name"
          autoComplete="given-name"
          value={values.first_name}
          onChange={set('first_name')}
          error={form.fieldError('first_name')}
        />
        <Input
          label={t('common.lastName')}
          name="last_name"
          autoComplete="family-name"
          value={values.last_name}
          onChange={set('last_name')}
          error={form.fieldError('last_name')}
        />
      </div>
      <Input
        label={t('common.email')}
        type="email"
        name="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={set('email')}
        error={form.fieldError('email')}
      />
      <Input
        label={t('common.password')}
        type="password"
        name="password"
        autoComplete="new-password"
        required
        value={values.password}
        onChange={set('password')}
        error={form.fieldError('password')}
      />
      <Input
        label={t('register.passwordConfirm')}
        type="password"
        name="confirm"
        autoComplete="new-password"
        required
        value={values.confirm}
        onChange={set('confirm')}
        error={mismatch ? t('register.mismatch') : undefined}
      />
      <Button
        type="submit"
        fullWidth
        loading={form.submitting}
        disabled={!values.email || !values.password || mismatch}
      >
        {t('register.submit')}
      </Button>
      {loginTo && (
        <div className="iu-form__links">
          <Link to={loginTo}>{t('register.haveAccount')}</Link>
        </div>
      )}
    </form>
  );
}
