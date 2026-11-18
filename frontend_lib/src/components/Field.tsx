import type { ReactNode } from 'react';
import { cx } from './cx';

export interface FieldProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint / error wrapper used by every form control. */
export function Field({ id, label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cx('iu-field', error ? 'iu-field--error' : undefined, className)}>
      {label && (
        <label htmlFor={id} className="iu-field__label">
          {label}
          {required && (
            <span aria-hidden="true" className="iu-field__required">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="iu-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="iu-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, hint?: ReactNode, error?: ReactNode): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
