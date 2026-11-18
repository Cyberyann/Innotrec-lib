import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { cx } from './cx';

export interface FooterLink {
  label: ReactNode;
  href: string;
}

export interface FooterProps {
  /** Copyright owner, e.g. "Innotrec". */
  owner?: ReactNode;
  year?: number;
  links?: FooterLink[];
  children?: ReactNode;
  className?: string;
}

export function Footer({
  owner,
  year = new Date().getFullYear(),
  links = [],
  children,
  className,
}: FooterProps) {
  const { t } = useI18n();
  return (
    <footer className={cx('iu-footer', className)}>
      <div className="iu-footer__inner">
        <p className="iu-footer__copy">
          © {year} {owner} {owner && '·'} {t('footer.rights')}
        </p>
        {children}
        {links.length > 0 && (
          <ul className="iu-footer__links">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
