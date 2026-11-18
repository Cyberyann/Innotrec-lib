import { Code } from '../components/Code';

export function CreateComponentPage() {
  return (
    <article>
      <h1>Create a component</h1>
      <p>
        Checklist for adding a component to <code>@innotrec/ui</code> so that every application can
        use it.
      </p>

      <h2 id="rules">Rules</h2>
      <ul>
        <li>
          <strong>One file</strong> in <code>frontend_lib/src/components/</code> (auth screens in{' '}
          <code>components/auth/</code>).
        </li>
        <li>
          <strong>Typed props</strong> exported as <code>XxxProps</code>; extend the native HTML
          attributes when wrapping an element and forward the ref.
        </li>
        <li>
          <strong>Styling</strong>: CSS classes prefixed <code>iu-</code> (BEM-like{' '}
          <code>iu-block__element--modifier</code>) in <code>src/styles/index.css</code>, using only{' '}
          <code>--iu-*</code> variables so themes and dark mode work.
        </li>
        <li>
          <strong>Texts</strong>: never hard-code user-facing strings: add keys to{' '}
          <code>i18n/messages.ts</code> (<code>en</code> and <code>fr</code>) and use{' '}
          <code>useI18n()</code>.
        </li>
        <li>
          <strong>Accessibility</strong>: labels, roles, keyboard support, visible focus (
          <code>var(--iu-focus)</code>).
        </li>
        <li>
          <strong>No new runtime dependency</strong> unless discussed: every app would inherit it.
        </li>
        <li>
          <strong>Test</strong> it with Testing Library (behaviour, not implementation).
        </li>
        <li>
          <strong>Export</strong> it from <code>src/index.ts</code>, document it here, add a line in{' '}
          <code>CHANGELOG.md</code>.
        </li>
      </ul>

      <h2 id="example">Example: a Tag component</h2>
      <Code title="frontend_lib/src/components/Tag.tsx">{`
import type { HTMLAttributes, ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { cx } from './cx';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  color?: 'primary' | 'neutral';
  onRemove?: () => void;
}

export function Tag({ children, color = 'neutral', onRemove, className, ...rest }: TagProps) {
  const { t } = useI18n();
  return (
    <span className={cx('iu-tag', \`iu-tag--\${color}\`, className)} {...rest}>
      {children}
      {onRemove && (
        <button type="button" className="iu-tag__remove" onClick={onRemove} aria-label={t('common.delete')}>
          ×
        </button>
      )}
    </span>
  );
}
`}</Code>
      <Code title="frontend_lib/src/styles/index.css">{`
.iu-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--iu-surface-muted);
  color: var(--iu-text);
}
.iu-tag--primary {
  background: color-mix(in srgb, var(--iu-color-primary) 15%, transparent);
  color: var(--iu-color-primary);
}
`}</Code>
      <Code title="frontend_lib/src/components/Tag.test.tsx">{`
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag } from './Tag';

it('can be removed', async () => {
  const onRemove = vi.fn();
  render(<Tag onRemove={onRemove}>react</Tag>);
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(onRemove).toHaveBeenCalled();
});
`}</Code>
      <Code title="frontend_lib/src/index.ts">{`export { Tag, type TagProps } from './components/Tag';`}</Code>

      <h2 id="workflow">Workflow</h2>
      <Code title="terminal">{`
npm run test:watch -w @innotrec/ui     # TDD
npm run dev:front                      # the sample app uses the library sources (HMR)
npm run build -w @innotrec/ui          # check the build + type declarations
npm run lint && npm run typecheck
`}</Code>
      <p>
        A component specific to one application stays in that application. Move it to the library
        when a second application needs it.
      </p>
    </article>
  );
}
