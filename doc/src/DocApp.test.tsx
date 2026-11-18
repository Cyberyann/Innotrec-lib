import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DocApp, PAGES } from './DocApp';

describe('documentation', () => {
  it.each(PAGES.map((p) => [p.label as string, p.to]))(
    'renders the "%s" page',
    async (_label, to) => {
      render(
        <MemoryRouter initialEntries={[to]}>
          <DocApp />
        </MemoryRouter>,
      );
      // the Components page also renders live auth forms, which have their own h1
      expect((await screen.findAllByRole('heading', { level: 1 })).length).toBeGreaterThan(0);
    },
  );
});
