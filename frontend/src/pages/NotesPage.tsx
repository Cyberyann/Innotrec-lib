import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  Select,
  Textarea,
  useApiForm,
  useAuth,
  type Column,
} from '@innotrec/ui';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { notesApi, type Category, type Note, type NoteInput } from '../api/notes';

const CATEGORIES = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'idea', label: 'Idea' },
];
const EMPTY: NoteInput = { title: '', content: '', category: 'work' };

export function NotesPage() {
  const { client } = useAuth();
  const api = useMemo(() => notesApi(client), [client]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Note | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotes((await api.list()).results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Note>[] = [
    { key: 'title', header: 'Title' },
    {
      key: 'category',
      header: 'Category',
      render: (n) => <Badge variant="info">{n.category}</Badge>,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (n) => new Date(n.created_at).toLocaleString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (n) => (
        <div className="iu-actions iu-actions--end">
          <Button size="sm" variant="secondary" onClick={() => setEditing(n)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            aria-label={`Delete ${n.title}`}
            onClick={async () => {
              await api.remove(n.id);
              await load();
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card title="My notes" actions={<Button onClick={() => setEditing('new')}>New note</Button>}>
      {error && <Alert variant="error">{error}</Alert>}
      <DataTable
        columns={columns}
        rows={notes}
        rowKey={(n) => n.id}
        loading={loading}
        empty="No note yet."
      />
      {editing && (
        <NoteModal
          note={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            if (editing === 'new') await api.create(input);
            else await api.update(editing.id, input);
            setEditing(null);
            await load();
          }}
        />
      )}
    </Card>
  );
}

function NoteModal({
  note,
  onClose,
  onSave,
}: {
  note: Note | null;
  onClose: () => void;
  onSave: (input: NoteInput) => Promise<void>;
}) {
  const form = useApiForm();
  const [values, setValues] = useState<NoteInput>(note ?? EMPTY);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await form.run(() => onSave(values));
  };
  return (
    <Modal open onClose={onClose} title={note ? 'Edit note' : 'New note'}>
      <form className="iu-form iu-form--plain" onSubmit={submit}>
        {form.error && <Alert variant="error">{form.error}</Alert>}
        <Input
          label="Title"
          required
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          error={form.fieldError('title')}
        />
        <Select
          label="Category"
          options={CATEGORIES}
          value={values.category}
          onChange={(e) => setValues({ ...values, category: e.target.value as Category })}
        />
        <Textarea
          label="Content"
          maxLength={2000}
          value={values.content}
          onChange={(e) => setValues({ ...values, content: e.target.value })}
        />
        <div className="iu-actions iu-actions--end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={form.submitting} disabled={!values.title}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
