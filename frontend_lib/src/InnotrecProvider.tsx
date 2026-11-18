import type { ReactNode } from 'react';
import type { ApiClient } from './api/client';
import { AuthProvider } from './auth/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import type { Messages } from './i18n/messages';

export interface InnotrecProviderProps {
  /** API root, default `/api`. Ignored if `client` is given. */
  apiBaseUrl?: string;
  client?: ApiClient;
  authPrefix?: string;
  locale?: string;
  messages?: Partial<Messages>;
  children: ReactNode;
}

/** One provider for everything: translations + authentication. */
export function InnotrecProvider({
  apiBaseUrl,
  client,
  authPrefix,
  locale,
  messages,
  children,
}: InnotrecProviderProps) {
  return (
    <I18nProvider locale={locale} messages={messages}>
      <AuthProvider apiBaseUrl={apiBaseUrl} client={client} authPrefix={authPrefix}>
        {children}
      </AuthProvider>
    </I18nProvider>
  );
}
