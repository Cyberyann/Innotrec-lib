export type TwoFactorMethod = 'none' | 'totp' | 'email';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email_verified: boolean;
  two_factor_method: TwoFactorMethod;
  two_factor_enabled: boolean;
  is_staff: boolean;
  date_joined: string;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  is_staff: boolean;
  email_verified: boolean;
  two_factor_method: TwoFactorMethod;
  date_joined: string;
  last_login: string | null;
}

export type AdminUserInput = Partial<
  Pick<
    AdminUser,
    | 'email'
    | 'first_name'
    | 'last_name'
    | 'is_active'
    | 'is_staff'
    | 'email_verified'
    | 'two_factor_method'
  >
> & { password?: string };

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type LoginResult =
  | { status: 'authenticated'; user: User }
  | { status: '2fa_required'; method: Exclude<TwoFactorMethod, 'none'> };

export interface RegisterInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface ProfileInput {
  first_name?: string;
  last_name?: string;
}

export interface TotpSetup {
  secret: string;
  otpauth_url: string;
  /** data: URL of an SVG QR code, ready for an <img src>. */
  qr_code: string;
}

export interface DetailResponse {
  detail: string;
}
