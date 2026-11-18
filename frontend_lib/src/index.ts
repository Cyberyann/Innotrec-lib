import './styles/index.css';

// providers & i18n
export { InnotrecProvider, type InnotrecProviderProps } from './InnotrecProvider';
export { I18nProvider, useI18n, type I18nProviderProps, type Translate } from './i18n/I18nContext';
export { en, fr, locales, type MessageKey, type Messages } from './i18n/messages';

// api
export {
  ApiClient,
  ApiError,
  readCookie,
  type ApiClientOptions,
  type FieldErrors,
  type RequestOptions,
} from './api/client';
export { createAuthApi, type AuthApi } from './api/authApi';
export type * from './api/types';

// auth
export {
  AuthProvider,
  useAuth,
  type AuthContextValue,
  type AuthProviderProps,
  type AuthStatus,
} from './auth/AuthContext';
export { RequireAnonymous, RequireAuth, type RequireAuthProps } from './auth/RequireAuth';
export { useApiForm } from './auth/useApiForm';

// generic components
export { Alert, type AlertProps, type AlertVariant } from './components/Alert';
export { AppLayout, type AppLayoutProps } from './components/AppLayout';
export { Badge, type BadgeProps } from './components/Badge';
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './components/Button';
export { Card, type CardProps } from './components/Card';
export { Chart, type ChartDatum, type ChartProps } from './components/Chart';
export { Checkbox, type CheckboxProps } from './components/Checkbox';
export { cx } from './components/cx';
export { DataTable, type Column, type DataTableProps } from './components/DataTable';
export { Field, type FieldProps } from './components/Field';
export { Footer, type FooterLink, type FooterProps } from './components/Footer';
export { Header, type HeaderProps } from './components/Header';
export { Image, type ImageProps } from './components/Image';
export { Input, type InputProps } from './components/Input';
export { Menu, type MenuItem, type MenuProps } from './components/Menu';
export { Modal, type ModalProps } from './components/Modal';
export { Select, type SelectOption, type SelectProps } from './components/Select';
export { Spinner, type SpinnerProps } from './components/Spinner';
export { Textarea, type TextareaProps } from './components/Textarea';

// authentication components
export {
  ChangePasswordForm,
  DeleteAccountForm,
  ProfileForm,
  type DeleteAccountFormProps,
} from './components/auth/AccountForms';
export { LoginForm, type LoginFormProps } from './components/auth/LoginForm';
export {
  PasswordResetConfirmForm,
  PasswordResetRequestForm,
  type PasswordResetConfirmFormProps,
  type PasswordResetRequestFormProps,
} from './components/auth/PasswordResetForms';
export { RegisterForm, type RegisterFormProps } from './components/auth/RegisterForm';
export { TwoFactorSettings } from './components/auth/TwoFactorSettings';
export { UserManagement } from './components/auth/UserManagement';
export { UserMenu, type UserMenuProps } from './components/auth/UserMenu';
export { VerifyEmail, type VerifyEmailProps } from './components/auth/VerifyEmail';
