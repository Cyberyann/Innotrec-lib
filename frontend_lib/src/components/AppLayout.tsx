import type { ReactNode } from 'react';
import { cx } from './cx';

export interface AppLayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Constrain the main column width (default true). */
  contained?: boolean;
  className?: string;
}

/** Page skeleton: header / (sidebar + main) / footer with a skip link. */
export function AppLayout({
  header,
  sidebar,
  footer,
  children,
  contained = true,
  className,
}: AppLayoutProps) {
  return (
    <div className={cx('iu-layout', className)}>
      <a href="#iu-main" className="iu-skip-link">
        Skip to content
      </a>
      {header}
      <div className={cx('iu-layout__body', sidebar ? 'iu-layout__body--sidebar' : undefined)}>
        {sidebar && <aside className="iu-layout__sidebar">{sidebar}</aside>}
        <main
          id="iu-main"
          className={cx('iu-layout__main', contained && 'iu-layout__main--contained')}
        >
          {children}
        </main>
      </div>
      {footer}
    </div>
  );
}
