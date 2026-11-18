import { useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useApiForm } from '../../auth/useApiForm';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Card } from '../Card';
import { Input } from '../Input';

/** Edit first / last name of the current user. */
export function ProfileForm() {
  const { t } = useI18n();
  const { user, api, setUser } = useAuth();
  const form = useApiForm();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    const updated = await form.run(() =>
      api.updateMe({ first_name: firstName, last_name: lastName }),
    );
    if (updated) {
      setUser(updated);
      setSaved(true);
    }
  };

  return (
    <Card title={t('profile.title')}>
      <form className="iu-form iu-form--plain" onSubmit={submit} noValidate>
        {form.error && <Alert variant="error">{form.error}</Alert>}
        {saved && <Alert variant="success">{t('common.saved')}</Alert>}
        <Input label={t('common.email')} value={user?.email ?? ''} readOnly disabled />
        <div className="iu-grid-2">
          <Input
            label={t('common.firstName')}
            name="first_name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={form.fieldError('first_name')}
          />
          <Input
            label={t('common.lastName')}
            name="last_name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={form.fieldError('last_name')}
          />
        </div>
        <div>
          <Button type="submit" loading={form.submitting}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ChangePasswordForm() {
  const { t } = useI18n();
  const { api } = useAuth();
  const form = useApiForm();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setDone(false);
    if (await form.run(() => api.changePassword(current, next))) {
      setDone(true);
      setCurrent('');
      setNext('');
    }
  };

  return (
    <Card title={t('password.title')}>
      <form className="iu-form iu-form--plain" onSubmit={submit} noValidate>
        {form.error && <Alert variant="error">{form.error}</Alert>}
        {done && <Alert variant="success">{t('password.changed')}</Alert>}
        <Input
          label={t('password.current')}
          type="password"
          name="current_password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={form.fieldError('current_password')}
        />
        <Input
          label={t('password.new')}
          type="password"
          name="new_password"
          autoComplete="new-password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={form.fieldError('new_password')}
        />
        <div>
          <Button type="submit" loading={form.submitting} disabled={!current || !next}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export interface DeleteAccountFormProps {
  onDeleted?: () => void;
}

export function DeleteAccountForm({ onDeleted }: DeleteAccountFormProps) {
  const { t } = useI18n();
  const { api, setUser } = useAuth();
  const form = useApiForm();
  const [password, setPassword] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await form.run(async () => {
      await api.deleteMe(password);
      return true;
    });
    if (result) {
      setUser(null);
      onDeleted?.();
    }
  };

  return (
    <Card title={t('delete.title')} className="iu-card--danger">
      <form className="iu-form iu-form--plain" onSubmit={submit} noValidate>
        <Alert variant="warning">{t('delete.warning')}</Alert>
        {form.error && <Alert variant="error">{form.error}</Alert>}
        <Input
          label={t('common.password')}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={form.fieldError('password')}
        />
        <div>
          <Button type="submit" variant="danger" loading={form.submitting} disabled={!password}>
            {t('delete.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
