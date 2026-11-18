import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function Card({
  title,
  subtitle,
  actions,
  footer,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <section className={cx('iu-card', className)} {...rest}>
      {(title || actions) && (
        <header className="iu-card__header">
          <div>
            {title && <h2 className="iu-card__title">{title}</h2>}
            {subtitle && <p className="iu-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="iu-card__actions">{actions}</div>}
        </header>
      )}
      <div className="iu-card__body">{children}</div>
      {footer && <footer className="iu-card__footer">{footer}</footer>}
    </section>
  );
}
