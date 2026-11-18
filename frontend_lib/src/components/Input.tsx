import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { cx } from './cx';
import { describedBy, Field } from './Field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** For `type="password"`: show an eye button to reveal the value (default true). */
  revealable?: boolean;
  fieldClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    id,
    type = 'text',
    revealable = true,
    required,
    className,
    fieldClassName,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const { t } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const control = (
    <input
      ref={ref}
      id={inputId}
      type={isPassword && revealed ? 'text' : type}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(inputId, hint, error)}
      className={cx('iu-input', className)}
      {...rest}
    />
  );
  return (
    <Field
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      {isPassword && revealable ? (
        <div className="iu-input-group">
          {control}
          <button
            type="button"
            className="iu-input-group__btn"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? t('common.hidePassword') : t('common.showPassword')}
            aria-pressed={revealed}
          >
            {revealed ? '🙈' : '👁'}
          </button>
        </div>
      ) : (
        control
      )}
    </Field>
  );
});
