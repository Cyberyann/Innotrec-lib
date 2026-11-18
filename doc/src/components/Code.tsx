import { useState } from 'react';

export function Code({ children, title }: { children: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const text = children.replace(/^\n/, '').replace(/\n\s*$/, '');
  return (
    <div className="code-block">
      {title && <div className="code-block__title">{title}</div>}
      <pre>
        <code>{text}</code>
      </pre>
      <button
        type="button"
        className="code-block__copy"
        onClick={async () => {
          await navigator.clipboard?.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Prop</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>
              <code>{row.name}</code>
            </td>
            <td>
              <code>{row.type}</code>
            </td>
            <td>{row.default ? <code>{row.default}</code> : '—'}</td>
            <td>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
