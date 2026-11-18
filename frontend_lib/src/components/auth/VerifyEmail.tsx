import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../Alert';
import { Spinner } from '../Spinner';

export interface VerifyEmailProps {
  uid: string;
  token: string;
  loginTo?: string;
}

/** Confirms the e-mail address as soon as it is displayed (link received by e-mail). */
export function VerifyEmail({ uid, token, loginTo }: VerifyEmailProps) {
  const { t } = useI18n();
  const { api } = useAuth();
  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const started = useRef(false); // tokens are single-use: avoid StrictMode double calls

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api
      .verifyEmail(uid, token)
      .then(() => setState('success'))
      .catch((error: unknown) => {
        setMessage(error instanceof ApiError ? error.message : String(error));
        setState('error');
      });
  }, [api, uid, token]);

  return (
    <div className="iu-form">
      <h1 className="iu-form__title">{t('verify.title')}</h1>
      {state === 'pending' && (
        <p>
          <Spinner size="sm" /> {t('verify.pending')}
        </p>
      )}
      {state === 'success' && <Alert variant="success">{t('verify.success')}</Alert>}
      {state === 'error' && <Alert variant="error">{message}</Alert>}
      {loginTo && state !== 'pending' && <Link to={loginTo}>{t('login.submit')}</Link>}
    </div>
  );
}
