import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { cx } from './cx';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  const { t } = useI18n();
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cx('iu-alert', `iu-alert--${variant}`, className)}
    >
      <div className="iu-alert__content">
        {title && <strong className="iu-alert__title">{title}</strong>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          className="iu-alert__close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          ×
        </button>
      )}
    </div>
  );
}
