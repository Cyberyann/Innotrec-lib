import type { ApiClient } from './client';
import type {
  AdminUser,
  AdminUserInput,
  DetailResponse,
  LoginResult,
  Paginated,
  ProfileInput,
  RegisterInput,
  TotpSetup,
  User,
} from './types';

/** Typed wrapper around every endpoint of the `innotrec-auth` Django library. */
export function createAuthApi(client: ApiClient, prefix = '/auth') {
  const p = (path: string) => `${prefix}${path}`;
  return {
    csrf: () => client.ensureCsrf(true),
    register: (input: RegisterInput) => client.post<User>(p('/register/'), input),
    verifyEmail: (uid: string, token: string) =>
      client.post<DetailResponse>(p('/verify-email/'), { uid, token }),
    resendVerification: (email: string) =>
      client.post<DetailResponse>(p('/verify-email/resend/'), { email }),
    login: (email: string, password: string) =>
      client.post<LoginResult>(p('/login/'), { email, password }),
    loginTwoFactor: (code: string) => client.post<LoginResult>(p('/login/2fa/'), { code }),
    resendLoginCode: () => client.post<DetailResponse>(p('/login/2fa/resend/')),
    logout: () => client.post<void>(p('/logout/')),
    me: () => client.get<User>(p('/me/')),
    updateMe: (input: ProfileInput) => client.patch<User>(p('/me/'), input),
    deleteMe: (password: string) => client.delete<void>(p('/me/'), { password }),
    changePassword: (currentPassword: string, newPassword: string) =>
      client.post<DetailResponse>(p('/password/change/'), {
        current_password: currentPassword,
        new_password: newPassword,
      }),
    requestPasswordReset: (email: string) =>
      client.post<DetailResponse>(p('/password/reset/'), { email }),
    confirmPasswordReset: (uid: string, token: string, newPassword: string) =>
      client.post<DetailResponse>(p('/password/reset/confirm/'), {
        uid,
        token,
        new_password: newPassword,
      }),
    totpSetup: () => client.post<TotpSetup>(p('/2fa/totp/setup/')),
    totpConfirm: (code: string) => client.post<User>(p('/2fa/totp/confirm/'), { code }),
    emailTwoFactorSetup: () => client.post<DetailResponse>(p('/2fa/email/setup/')),
    emailTwoFactorConfirm: (code: string) => client.post<User>(p('/2fa/email/confirm/'), { code }),
    disableTwoFactor: (password: string) => client.post<User>(p('/2fa/disable/'), { password }),
    users: {
      list: (params: { page?: number; search?: string } = {}) =>
        client.get<Paginated<AdminUser>>(p('/users/'), { query: params }),
      get: (id: string) => client.get<AdminUser>(p(`/users/${id}/`)),
      create: (input: AdminUserInput & { email: string; password: string }) =>
        client.post<AdminUser>(p('/users/'), input),
      update: (id: string, input: AdminUserInput) =>
        client.patch<AdminUser>(p(`/users/${id}/`), input),
      remove: (id: string) => client.delete<void>(p(`/users/${id}/`)),
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
