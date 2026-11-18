import { Link } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../Button';

export interface UserMenuProps {
  profileTo?: string;
  loginTo?: string;
  onLogout?: () => void;
}

/** Header widget: user name + profile link + logout (or a login link when anonymous). */
export function UserMenu({ profileTo = '/profile', loginTo = '/login', onLogout }: UserMenuProps) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  if (!user) {
    return (
      <Link className="iu-btn iu-btn--primary iu-btn--sm" to={loginTo}>
        {t('login.submit')}
      </Link>
    );
  }
  return (
    <div className="iu-user-menu">
      <Link to={profileTo} className="iu-user-menu__name" title={t('menu.profile')}>
        <span className="iu-avatar" aria-hidden="true">
          {(user.first_name || user.email).charAt(0).toUpperCase()}
        </span>
        <span>{user.full_name || user.email}</span>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await logout();
          onLogout?.();
        }}
      >
        {t('menu.logout')}
      </Button>
    </div>
  );
}
