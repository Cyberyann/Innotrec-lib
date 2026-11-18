import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { en, locales, type MessageKey, type Messages } from './messages';

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

interface I18nValue {
  locale: string;
  t: Translate;
}

const I18nContext = createContext<I18nValue | null>(null);

export interface I18nProviderProps {
  /** Built-in locale (`en`, `fr`) or any locale for which `messages` are provided. */
  locale?: string;
  /** Override any message (partial). */
  messages?: Partial<Messages>;
  children: ReactNode;
}

export function I18nProvider({ locale = 'en', messages, children }: I18nProviderProps) {
  const dictionary = useMemo<Messages>(
    () => ({ ...en, ...(locales[locale] ?? {}), ...(messages ?? {}) }),
    [locale, messages],
  );
  const t = useCallback<Translate>(
    (key, vars) => {
      let text: string = dictionary[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [dictionary],
  );
  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const fallback: I18nValue = {
  locale: 'en',
  t: (key, vars) => {
    let text: string = en[key] ?? key;
    for (const [name, value] of Object.entries(vars ?? {})) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  },
};

/** Works without provider (falls back to English) so components can be used standalone. */
export function useI18n(): I18nValue {
  return useContext(I18nContext) ?? fallback;
}
