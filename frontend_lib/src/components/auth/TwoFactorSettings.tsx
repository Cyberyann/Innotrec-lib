import { useState, type FormEvent } from 'react';
import type { TotpSetup } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useApiForm } from '../../auth/useApiForm';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Card } from '../Card';
import { Input } from '../Input';

type Mode =
  { kind: 'idle' } | { kind: 'totp'; setup: TotpSetup } | { kind: 'email' } | { kind: 'disable' };

/** Enable / disable the second factor (authenticator app or e-mail code). */
export function TwoFactorSettings() {
  const { t } = useI18n();
  const { user, api, setUser } = useAuth();
  const form = useApiForm();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  if (!user) return null;

  const close = (msg: string | null = null) => {
    setMode({ kind: 'idle' });
    setCode('');
    setPassword('');
    setMessage(msg);
    form.reset();
  };

  const startTotp = async () => {
    setMessage(null);
    const setup = await form.run(() => api.totpSetup());
    if (setup) setMode({ kind: 'totp', setup });
  };

  const startEmail = async () => {
    setMessage(null);
    if (await form.run(() => api.emailTwoFactorSetup())) setMode({ kind: 'email' });
  };

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    const updated = await form.run(() =>
      mode.kind === 'totp' ? api.totpConfirm(code) : api.emailTwoFactorConfirm(code),
    );
    if (updated) {
      setUser(updated);
      close(t('twofa.enabled'));
    }
  };

  const disable = async (event: FormEvent) => {
    event.preventDefault();
    const updated = await form.run(() => api.disableTwoFactor(password));
    if (updated) {
      setUser(updated);
      close(t('twofa.disabled'));
    }
  };

  return (
    <Card title={t('twofa.title')}>
      <p>{t('twofa.status', { method: t(`twofa.method.${user.two_factor_method}`) })}</p>
      {message && <Alert variant="success">{message}</Alert>}
      {form.error && <Alert variant="error">{form.error}</Alert>}

      {mode.kind === 'idle' && (
        <div className="iu-actions">
          {user.two_factor_method !== 'totp' && (
            <Button variant="secondary" onClick={startTotp} loading={form.submitting}>
              {t('twofa.enableTotp')}
            </Button>
          )}
          {user.two_factor_method !== 'email' && (
            <Button variant="secondary" onClick={startEmail} loading={form.submitting}>
              {t('twofa.enableEmail')}
            </Button>
          )}
          {user.two_factor_enabled && (
            <Button variant="danger" onClick={() => setMode({ kind: 'disable' })}>
              {t('twofa.disable')}
            </Button>
          )}
        </div>
      )}

      {(mode.kind === 'totp' || mode.kind === 'email') && (
        <form className="iu-form iu-form--plain" onSubmit={confirm} noValidate>
          {mode.kind === 'totp' ? (
            <>
              <p>{t('twofa.scan')}</p>
              <img
                src={mode.setup.qr_code}
                alt="QR code"
                width={180}
                height={180}
                className="iu-qr"
              />
              <p className="iu-muted">{t('twofa.secret', { secret: mode.setup.secret })}</p>
            </>
          ) : (
            <p>{t('twofa.emailSent')}</p>
          )}
          <Input
            label={t('twofa.code')}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            maxLength={10}
            required
            error={form.fieldError('code')}
          />
          <div className="iu-actions">
            <Button type="submit" loading={form.submitting} disabled={code.length < 6}>
              {t('twofa.verify')}
            </Button>
            <Button variant="ghost" onClick={() => close()}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      )}

      {mode.kind === 'disable' && (
        <form className="iu-form iu-form--plain" onSubmit={disable} noValidate>
          <Input
            label={t('twofa.disableConfirm')}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={form.fieldError('password')}
          />
          <div className="iu-actions">
            <Button type="submit" variant="danger" loading={form.submitting} disabled={!password}>
              {t('twofa.disable')}
            </Button>
            <Button variant="ghost" onClick={() => close()}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
