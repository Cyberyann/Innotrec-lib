import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { AdminUser, AdminUserInput, Paginated } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useApiForm } from '../../auth/useApiForm';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../Alert';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card } from '../Card';
import { Checkbox } from '../Checkbox';
import { DataTable, type Column } from '../DataTable';
import { Input } from '../Input';
import { Modal } from '../Modal';

const PAGE_SIZE = 25;

type Editing = { kind: 'create' } | { kind: 'edit'; user: AdminUser } | null;

/** Staff-only CRUD screen on every user of the shared database. */
export function UserManagement() {
  const { t } = useI18n();
  const { api, user: me } = useAuth();
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.users.list({ page, search: query }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [api, page, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (target: AdminUser) => {
    if (!window.confirm(t('users.confirmDelete', { email: target.email }))) return;
    try {
      await api.users.remove(target.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const yesNo = (value: boolean) => (
    <Badge variant={value ? 'success' : 'neutral'}>
      {value ? t('common.yes') : t('common.no')}
    </Badge>
  );
  const columns: Column<AdminUser>[] = [
    { key: 'email', header: t('common.email') },
    { key: 'full_name', header: `${t('common.firstName')} / ${t('common.lastName')}` },
    {
      key: 'is_active',
      header: t('users.active'),
      render: (u) => yesNo(u.is_active),
      align: 'center',
    },
    {
      key: 'is_staff',
      header: t('users.staff'),
      render: (u) => yesNo(u.is_staff),
      align: 'center',
    },
    {
      key: 'email_verified',
      header: t('users.verified'),
      render: (u) => yesNo(u.email_verified),
      align: 'center',
    },
    { key: 'two_factor_method', header: t('users.twofa'), align: 'center' },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'right',
      render: (u) => (
        <div className="iu-actions iu-actions--end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing({ kind: 'edit', user: u })}
          >
            {t('common.edit')}
          </Button>
          <Button size="sm" variant="danger" disabled={u.id === me?.id} onClick={() => remove(u)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];
  const pages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <Card
      title={t('users.title')}
      actions={<Button onClick={() => setEditing({ kind: 'create' })}>{t('users.new')}</Button>}
    >
      <form
        className="iu-toolbar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search);
        }}
      >
        <Input
          aria-label={t('common.search')}
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="search"
        />
        <Button type="submit" variant="secondary">
          {t('common.search')}
        </Button>
      </form>
      {error && <Alert variant="error">{error}</Alert>}
      <DataTable
        columns={columns}
        rows={data?.results ?? []}
        rowKey={(u) => u.id}
        loading={loading}
        empty={t('users.empty')}
      />
      <div className="iu-pagination">
        <Button
          size="sm"
          variant="ghost"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t('common.previous')}
        </Button>
        <span>
          {page} / {pages}
        </span>
        <Button
          size="sm"
          variant="ghost"
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          {t('common.next')}
        </Button>
      </div>
      {editing && (
        <UserEditModal
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </Card>
  );
}

function UserEditModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Exclude<Editing, null>;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { t } = useI18n();
  const { api } = useAuth();
  const form = useApiForm();
  const initial = editing.kind === 'edit' ? editing.user : null;
  const [values, setValues] = useState({
    email: initial?.email ?? '',
    first_name: initial?.first_name ?? '',
    last_name: initial?.last_name ?? '',
    password: '',
    is_active: initial?.is_active ?? true,
    is_staff: initial?.is_staff ?? false,
    email_verified: initial?.email_verified ?? true,
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const { password, ...rest } = values;
    const payload: AdminUserInput = password ? { ...rest, password } : rest;
    const saved = await form.run(() =>
      initial ? api.users.update(initial.id, payload) : api.users.create({ ...rest, password }),
    );
    if (saved) await onSaved();
  };

  const text = (name: 'email' | 'first_name' | 'last_name' | 'password') => ({
    name,
    value: values[name],
    onChange: (e: { target: { value: string } }) =>
      setValues((v) => ({ ...v, [name]: e.target.value })),
    error: form.fieldError(name),
  });
  const check = (name: 'is_active' | 'is_staff' | 'email_verified') => ({
    name,
    checked: values[name],
    onChange: (e: { target: { checked: boolean } }) =>
      setValues((v) => ({ ...v, [name]: e.target.checked })),
  });

  return (
    <Modal open onClose={onClose} title={initial ? initial.email : t('users.new')}>
      <form className="iu-form iu-form--plain" onSubmit={submit} noValidate>
        {form.error && <Alert variant="error">{form.error}</Alert>}
        <Input label={t('common.email')} type="email" required {...text('email')} />
        <div className="iu-grid-2">
          <Input label={t('common.firstName')} {...text('first_name')} />
          <Input label={t('common.lastName')} {...text('last_name')} />
        </div>
        <Input
          label={t('common.password')}
          type="password"
          autoComplete="new-password"
          required={!initial}
          hint={initial ? t('users.passwordHelp') : undefined}
          {...text('password')}
        />
        <Checkbox switch label={t('users.active')} {...check('is_active')} />
        <Checkbox switch label={t('users.staff')} {...check('is_staff')} />
        <Checkbox switch label={t('users.verified')} {...check('email_verified')} />
        <div className="iu-actions iu-actions--end">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={form.submitting}>
            {initial ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
