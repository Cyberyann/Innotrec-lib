import type { ReactNode } from 'react';
import { cx } from './cx';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return <span className={cx('iu-badge', `iu-badge--${variant}`, className)}>{children}</span>;
}
