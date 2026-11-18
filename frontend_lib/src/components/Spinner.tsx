import { cx } from './cx';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Center the spinner in its container. */
  center?: boolean;
  label?: string;
  className?: string;
}

export function Spinner({
  size = 'md',
  center = false,
  label = 'Loading…',
  className,
}: SpinnerProps) {
  const spinner = (
    <span
      role="status"
      aria-label={label}
      className={cx('iu-spinner', `iu-spinner--${size}`, className)}
    />
  );
  return center ? <div className="iu-center">{spinner}</div> : spinner;
}
