import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nContext';
import { cx } from './cx';
import { Menu, type MenuItem } from './Menu';

export interface HeaderProps {
  title?: ReactNode;
  logoSrc?: string;
  logoAlt?: string;
  homeTo?: string;
  items?: MenuItem[];
  /** Right side content, e.g. `<UserMenu />`. */
  actions?: ReactNode;
  sticky?: boolean;
  className?: string;
}

export function Header({
  title,
  logoSrc,
  logoAlt = '',
  homeTo = '/',
  items = [],
  actions,
  sticky = true,
  className,
}: HeaderProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <header className={cx('iu-header', sticky && 'iu-header--sticky', className)}>
      <div className="iu-header__inner">
        <Link to={homeTo} className="iu-header__brand">
          {logoSrc && <img src={logoSrc} alt={logoAlt} className="iu-header__logo" />}
          {title && <span className="iu-header__title">{title}</span>}
        </Link>
        {items.length > 0 && (
          <button
            type="button"
            className="iu-header__toggle"
            aria-expanded={open}
            aria-label={t('menu.toggle')}
            onClick={() => setOpen((value) => !value)}
          >
            ☰
          </button>
        )}
        <div className={cx('iu-header__nav', open && 'iu-header__nav--open')}>
          {items.length > 0 && <Menu items={items} onNavigate={() => setOpen(false)} />}
          {actions && <div className="iu-header__actions">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
