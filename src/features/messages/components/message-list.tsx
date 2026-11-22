import { useQuery } from '@tanstack/react-query';
import { messagesListOptions } from '../api/messages.api';

export function MessageList() {
  const { data, isPending, isError, error } = useQuery(messagesListOptions());

  if (isPending) return <p className="text-muted-foreground">Loading…</p>;
  if (isError) {
    return (
      <p role="alert" className="text-danger">
        Error: {error.message}
      </p>
    );
  }
  if (data.length === 0) return <p className="text-muted-foreground">No messages found.</p>;

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {data.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <span>{m.text}</span>
          <small className="text-muted-foreground">
            {new Date(m.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </small>
        </li>
      ))}
    </ul>
  );
}
