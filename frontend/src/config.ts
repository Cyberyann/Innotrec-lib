/** Runtime configuration read from the .env file (embedded at build time). */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  appName: import.meta.env.VITE_APP_NAME || 'Innotrec Sample',
  locale: import.meta.env.VITE_DEFAULT_LOCALE || 'en',
  requireEmailVerification: import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION !== 'false',
} as const;
