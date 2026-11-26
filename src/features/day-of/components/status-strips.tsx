import { AlertTriangle, ChevronRight, CloudOff } from 'lucide-react';
import { formatClock } from '@/lib/format';
import type { AgendaTask } from '../api/agenda.schema';

type OfflineBarProps = { online: boolean; waiting: number };

/** Design system: a slim `surface-sunken` bar, "Offline · changes will sync". Never blocks actions. */
export function OfflineBar({ online, waiting }: OfflineBarProps) {
  if (online && waiting === 0) return null;
  const changes = waiting === 1 ? '1 change' : `${String(waiting)} changes`;
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-sm bg-muted px-3 py-2 text-label text-muted-foreground"
    >
      <CloudOff className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      {online
        ? `Syncing ${changes}…`
        : `Offline · changes will sync${waiting > 0 ? ` (${changes} waiting)` : ''}`}
    </p>
  );
}

type OverdueStripProps = { tasks: readonly AgendaTask[]; onOpen: (task: AgendaTask) => void };

/** Spec §14 wireframe's top line: the first overdue task across today's functions. */
export function OverdueStrip({ tasks, onOpen }: OverdueStripProps) {
  const [first] = tasks;
  if (!first) return null;
  const more = tasks.length > 1 ? ` and ${String(tasks.length - 1)} more` : '';
  const detail = [
    first.functionName ?? 'General',
    first.vendor?.name,
    first.dueTime ? formatClock(first.dueTime) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <button
      type="button"
      onClick={() => {
        onOpen(first);
      }}
      className="flex min-h-12 w-full items-center gap-3 rounded-md bg-danger-soft px-4 py-2 text-left text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <AlertTriangle className="size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-label">
          Overdue: {first.title}
          {more}
        </span>
        <span className="text-caption tabular-nums">{detail}</span>
      </span>
      <ChevronRight className="size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
