import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  /** Render as a toggle switch. */
  switch?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, switch: asSwitch = false, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cx('iu-check', asSwitch && 'iu-check--switch', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        role={asSwitch ? 'switch' : undefined}
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
});
