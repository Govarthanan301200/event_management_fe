import { Check, Phone } from 'lucide-react';
import { RowMenu, type RowMenuItem } from '@/components/shared/row-menu';
import { formatClock, formatDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Task } from '../api/tasks.schema';
import type { TaskActions } from '../hooks/use-task-dialogs';
import { TaskTag } from './task-tag';

type TaskRowProps = {
  task: Task;
  /** Day-of rows sit under their day, so they show the time only. */
  showDate: boolean;
  overdue: boolean;
  actions: TaskActions;
  /** Opened from the dashboard (`?task=`): a 2 s gold-soft glow. */
  arrived?: boolean;
};

/** One task: Done toggle, title with its status words, when, the service and vendor, ⋯. */
export function TaskRow({ task, showDate, overdue, actions, arrived = false }: TaskRowProps) {
  const done = task.status === 'done';
  const time = task.dueTime === null ? null : formatClock(task.dueTime);
  const when = showDate
    ? [formatDay(task.dueDate), time].filter(Boolean).join(' · ')
    : (time ?? 'Any time');
  const service = task.serviceName
    ? `${task.serviceName} · ${task.vendor?.name ?? 'No vendor'}`
    : 'General';
  const items: RowMenuItem[] = [
    {
      label: 'Edit',
      onSelect: () => {
        actions.edit(task);
      },
    },
    task.status === 'pending'
      ? {
          label: 'Mark as issue',
          onSelect: () => {
            actions.markIssue(task);
          },
        }
      : {
          label: 'Back to pending',
          onSelect: () => {
            actions.reopen(task);
          },
        },
    {
      label: 'Delete',
      tone: 'danger',
      onSelect: () => {
        actions.remove(task);
      },
    },
  ];

  return (
    <li
      id={`task-${task.id}`}
      className={cn('flex items-start gap-3 bg-card px-4 py-3', arrived && 'animate-arrive')}
    >
      <button
        type="button"
        aria-label={done ? `Mark “${task.title}” not done` : `Mark “${task.title}” done`}
        onClick={() => {
          actions.toggleDone(task);
        }}
        className={cn(
          'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          done
            ? 'border-success bg-success-soft text-success'
            : 'border-input hover:border-foreground',
        )}
      >
        {done ? <Check className="size-4" strokeWidth={1.5} aria-hidden="true" /> : null}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn('text-body font-semibold', done && 'text-muted-foreground line-through')}
          >
            {task.title}
          </span>
          {done ? <TaskTag tone="success">Done</TaskTag> : null}
          {task.status === 'issue' ? <TaskTag tone="danger">⚠ Issue</TaskTag> : null}
          {overdue ? <TaskTag tone="danger">⚠ Overdue</TaskTag> : null}
        </p>
        <p className="text-caption text-muted-foreground">
          <span className="tabular-nums">{when}</span> · {service}
        </p>
        {task.status === 'issue' && task.issueNote ? (
          <p className="text-caption text-danger">⚠ {task.issueNote}</p>
        ) : null}
      </div>
      {task.vendor ? (
        <a
          href={`tel:${task.vendor.phone.replace(/\s+/g, '')}`}
          aria-label={`Call ${task.vendor.name}`}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Phone className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </a>
      ) : null}
      <RowMenu label={`Actions for ${task.title}`} items={items} />
    </li>
  );
}
