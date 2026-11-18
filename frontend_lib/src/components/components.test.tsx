import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n/I18nContext';
import { Alert } from './Alert';
import { Button } from './Button';
import { Card } from './Card';
import { Chart, niceMax } from './Chart';
import { Checkbox } from './Checkbox';
import { DataTable } from './DataTable';
import { Footer } from './Footer';
import { Header } from './Header';
import { Image } from './Image';
import { Input } from './Input';
import { Menu } from './Menu';
import { Modal } from './Modal';
import { Select } from './Select';
import { Textarea } from './Textarea';

describe('Button', () => {
  it('renders variants and handles clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="danger" onClick={onClick}>
        Delete
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('iu-btn--danger');
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and busy while loading', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});

describe('Input', () => {
  it('links label, hint and error', () => {
    const { rerender } = render(<Input label="Name" hint="Your name" />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAccessibleDescription('Your name');
    rerender(<Input label="Name" hint="Your name" error="Required" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('can reveal a password', async () => {
    render(<Input label="Password" type="password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('uses translations from the provider', () => {
    render(
      <I18nProvider locale="fr">
        <Input label="Mot de passe" type="password" />
      </I18nProvider>,
    );
    expect(screen.getByRole('button', { name: 'Afficher le mot de passe' })).toBeInTheDocument();
  });
});

describe('Textarea / Select / Checkbox', () => {
  it('shows a character counter', async () => {
    render(<Textarea label="Comment" maxLength={10} />);
    await userEvent.type(screen.getByLabelText('Comment'), 'hello');
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('renders select options with placeholder', async () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Color"
        placeholder="Pick one"
        onChange={onChange}
        options={[
          { value: 'r', label: 'Red' },
          { value: 'b', label: 'Blue' },
        ]}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText('Color'), 'b');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders a switch checkbox', async () => {
    render(<Checkbox label="Active" switch />);
    const box = screen.getByRole('switch', { name: 'Active' });
    await userEvent.click(box);
    expect(box).toBeChecked();
  });
});

describe('Image', () => {
  it('falls back when the image fails', () => {
    render(<Image src="/broken.png" fallbackSrc="/fallback.png" alt="Logo" caption="Our logo" />);
    const img = screen.getByAltText('Logo');
    expect(img).toHaveAttribute('loading', 'lazy');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/fallback.png');
    expect(screen.getByText('Our logo')).toBeInTheDocument();
  });
});

describe('Alert / Card', () => {
  it('uses role=alert for errors and can be closed', async () => {
    const onClose = vi.fn();
    render(
      <Alert variant="error" title="Oops" onClose={onClose}>
        Broken
      </Alert>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('OopsBroken');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders card title, actions and footer', () => {
    render(
      <Card title="Stats" actions={<button>Refresh</button>} footer="footer">
        Body
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Stats' })).toBeInTheDocument();
    expect(screen.getByText('footer')).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('opens, traps focus and closes on Escape', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open={false} onClose={onClose} title="Edit">
        Content
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(
      <Modal open onClose={onClose} title="Edit">
        <input aria-label="field" />
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Edit' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('Menu / Header / Footer', () => {
  it('marks the active route', () => {
    render(
      <MemoryRouter initialEntries={['/notes']}>
        <Menu
          items={[
            { label: 'Home', to: '/' },
            { label: 'Notes', to: '/notes' },
            { label: 'Hidden', to: '/h', hidden: true },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Notes' })).toHaveClass('iu-menu__link--active');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass('iu-menu__link--active');
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('toggles the mobile navigation', async () => {
    render(
      <MemoryRouter>
        <Header title="App" items={[{ label: 'Home', to: '/' }]} actions={<span>user</span>} />
      </MemoryRouter>,
    );
    const toggle = screen.getByRole('button', { name: 'Toggle navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'App' })).toHaveAttribute('href', '/');
  });

  it('renders footer links', () => {
    render(<Footer owner="Innotrec" year={2026} links={[{ label: 'Legal', href: '/legal' }]} />);
    expect(screen.getByText(/© 2026 Innotrec/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute('href', '/legal');
  });
});

describe('DataTable', () => {
  it('renders rows, custom cells and empty state', () => {
    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'age', header: 'Age', render: (row: { age: number }) => `${row.age} y` },
    ];
    const { rerender } = render(
      <DataTable columns={columns} rows={[{ id: 1, name: 'Ann', age: 30 }]} rowKey={(r) => r.id} />,
    );
    expect(screen.getByRole('cell', { name: 'Ann' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '30 y' })).toBeInTheDocument();
    rerender(<DataTable columns={columns} rows={[]} rowKey={() => 1} empty="Nothing" />);
    expect(screen.getByText('Nothing')).toBeInTheDocument();
  });
});

describe('Chart', () => {
  const data = [
    { label: 'A', value: 4 },
    { label: 'B', value: 10 },
  ];

  it.each(['bar', 'line', 'donut'] as const)('renders an accessible %s chart', (type) => {
    const { container } = render(<Chart type={type} title="Sales" data={data} />);
    expect(screen.getByRole('img', { name: 'Sales' })).toBeInTheDocument();
    // hidden data table for screen readers
    expect(screen.getByRole('rowheader', { name: 'B' })).toBeInTheDocument();
    const marks = {
      bar: 'rect.iu-chart__bar',
      line: 'circle.iu-chart__point',
      donut: 'path.iu-chart__slice',
    };
    expect(container.querySelectorAll(marks[type])).toHaveLength(2);
  });

  it('rounds the axis to a close, readable maximum', () => {
    expect(niceMax(24)).toBe(25);
    expect(niceMax(7)).toBe(8);
    expect(niceMax(100)).toBe(100);
    expect(niceMax(0)).toBe(1);
  });

  it('shows an empty state', () => {
    render(<Chart title="Empty" data={[]} />);
    expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
  });
});
