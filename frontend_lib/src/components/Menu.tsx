import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cx } from './cx';

export interface MenuItem {
  label: ReactNode;
  /** Internal route (react-router). */
  to?: string;
  /** External link. */
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  /** Exact match for the active state (default true for `/`). */
  end?: boolean;
  hidden?: boolean;
  key?: string;
}

export interface MenuProps {
  items: MenuItem[];
  orientation?: 'horizontal' | 'vertical';
  ariaLabel?: string;
  onNavigate?: () => void;
  className?: string;
}

export function Menu({
  items,
  orientation = 'horizontal',
  ariaLabel = 'Main',
  onNavigate,
  className,
}: MenuProps) {
  return (
    <nav aria-label={ariaLabel} className={cx('iu-menu', `iu-menu--${orientation}`, className)}>
      <ul className="iu-menu__list">
        {items
          .filter((item) => !item.hidden)
          .map((item, index) => {
            const key = item.key ?? item.to ?? item.href ?? String(index);
            const content = (
              <>
                {item.icon && (
                  <span className="iu-menu__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </>
            );
            let element: ReactNode;
            if (item.to !== undefined) {
              element = (
                <NavLink
                  to={item.to}
                  end={item.end ?? item.to === '/'}
                  className={({ isActive }) =>
                    cx('iu-menu__link', isActive && 'iu-menu__link--active')
                  }
                  onClick={() => {
                    item.onClick?.();
                    onNavigate?.();
                  }}
                >
                  {content}
                </NavLink>
              );
            } else if (item.href !== undefined) {
              element = (
                <a
                  className="iu-menu__link"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content}
                </a>
              );
            } else {
              element = (
                <button
                  type="button"
                  className="iu-menu__link"
                  onClick={() => {
                    item.onClick?.();
                    onNavigate?.();
                  }}
                >
                  {content}
                </button>
              );
            }
            return <li key={key}>{element}</li>;
          })}
      </ul>
    </nav>
  );
}
