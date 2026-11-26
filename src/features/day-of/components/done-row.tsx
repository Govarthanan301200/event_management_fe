import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaskActions } from '@/features/tasks';
import { formatClock } from '@/lib/format';
import type { AgendaTask } from '../api/agenda.schema';

type DoneRowProps = { task: AgendaTask; actions: TaskActions };

/** Spec §14 wireframe: "✓ Photo team arrived · 16:30", with Not done to take it back. */
export function DoneRow({ task, actions }: DoneRowProps) {
  return (
    <li className="flex min-h-12 items-center gap-3 px-4 py-2">
      <Check className="size-5 shrink-0 text-success" strokeWidth={1.5} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-body-touch text-muted-foreground">
        <span className="sr-only">Done: </span>
        {task.title}
        {task.dueTime === null ? null : (
          <span className="tabular-nums"> · {formatClock(task.dueTime)}</span>
        )}
      </p>
      <Button
        variant="ghost"
        className="h-12 px-3 text-label"
        aria-label={`Mark “${task.title}” not done`}
        onClick={() => {
          actions.toggleDone(task);
        }}
      >
        Not done
      </Button>
    </li>
  );
}
