import { forwardRef, useId, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cx } from './cx';
import { describedBy, Field } from './Field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Display a `n / maxLength` counter when maxLength is set (default true). */
  showCount?: boolean;
  fieldClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    id,
    required,
    maxLength,
    showCount = true,
    className,
    fieldClassName,
    onChange,
    rows = 4,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const initial = String(rest.value ?? rest.defaultValue ?? '');
  const [length, setLength] = useState(initial.length);
  const currentLength = rest.value !== undefined ? String(rest.value).length : length;
  return (
    <Field
      id={textareaId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, hint, error)}
        className={cx('iu-input', 'iu-textarea', className)}
        onChange={(event) => {
          setLength(event.target.value.length);
          onChange?.(event);
        }}
        {...rest}
      />
      {maxLength !== undefined && showCount && (
        <span className="iu-textarea__count" aria-live="polite">
          {currentLength} / {maxLength}
        </span>
      )}
    </Field>
  );
});
