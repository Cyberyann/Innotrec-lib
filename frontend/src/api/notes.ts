import type { ApiClient, ChartDatum, Paginated } from '@innotrec/ui';

export type Category = 'work' | 'personal' | 'idea';

export interface Note {
  id: number;
  title: string;
  content: string;
  category: Category;
  created_at: string;
  updated_at: string;
}

export type NoteInput = Pick<Note, 'title' | 'content' | 'category'>;

/** Business endpoints of the sample app reuse the library's ApiClient (CSRF + cookies). */
export function notesApi(client: ApiClient) {
  return {
    list: (page = 1) => client.get<Paginated<Note>>('/notes/', { query: { page } }),
    create: (input: NoteInput) => client.post<Note>('/notes/', input),
    update: (id: number, input: Partial<NoteInput>) => client.patch<Note>(`/notes/${id}/`, input),
    remove: (id: number) => client.delete<void>(`/notes/${id}/`),
    stats: () => client.get<ChartDatum[]>('/notes/stats/'),
  };
}
