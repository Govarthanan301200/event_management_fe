import { AlertTriangle, Phone } from 'lucide-react';
import { useState } from 'react';
import { RowMenu, type RowMenuItem } from '@/components/shared/row-menu';
import { Button } from '@/components/ui/button';
import { TaskTag, type TaskActions } from '@/features/tasks';
import { formatClock, formatDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AgendaTask } from '../api/agenda.schema';

/** Design system Motion: the card settles into Done 400ms after the check draws. */
const SETTLE_MS = 400;

type DayTaskCardProps = {
  task: AgendaTask;
  actions: TaskActions;
  onCall: (task: AgendaTask) => void;
  overdue: boolean;
  /** Upcoming spans events and dates; Today shows neither. */
  context?: { event: boolean; date: boolean };
  /** Opened from a reminder: glows gold-soft for 2s. */
  arrived?: boolean;
};

function metaLine(task: AgendaTask, context: DayTaskCardProps['context']): string {
  const who = task.serviceName
    ? `${task.serviceName} · ${task.vendor?.name ?? 'No vendor'}`
    : 'General';
  const due = task.dueTime === null ? 'any time' : `due ${formatClock(task.dueTime)}`;
  const when = context?.date ? `${formatDay(task.dueDate)} · ${due}` : due;
  return [context?.event ? task.eventName : null, who, when].filter(Boolean).join(' · ');
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A Today / Upcoming task card (spec §14, design system Mobile Today): title, vendor and service,
 * due time; Call and Issue as outline buttons, Done as the primary on the right within thumb reach.
 */
export function DayTaskCard({
  task,
  actions,
  onCall,
  overdue,
  context,
  arrived = false,
}: DayTaskCardProps) {
  const [settling, setSettling] = useState(false);
  const done = task.status === 'done';

  const markDone = () => {
    if ('vibrate' in navigator) navigator.vibrate(10); // a light haptic tap where the phone has one
    if (prefersReducedMotion()) {
      actions.toggleDone(task);
      return;
    }
    setSettling(true);
    setTimeout(() => {
      actions.toggleDone(task);
    }, SETTLE_MS);
  };

  const menu: RowMenuItem[] = [
    {
      label: 'Edit',
      onSelect: () => {
        actions.edit(task);
      },
    },
    ...(task.status === 'pending'
      ? []
      : [
          {
            label: 'Back to pending',
            onSelect: () => {
              actions.reopen(task);
            },
          },
        ]),
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
      className={cn(
        'flex flex-col gap-3 rounded-md border border-border bg-card p-4 sunlight:border-2',
        arrived && 'animate-arrive',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'text-body-touch font-semibold',
                done && 'text-muted-foreground line-through',
              )}
            >
              {task.title}
            </span>
            {task.status === 'issue' ? <TaskTag tone="danger">⚠ Issue</TaskTag> : null}
            {overdue ? <TaskTag tone="danger">⚠ Overdue</TaskTag> : null}
          </p>
          <p className="text-body-touch text-muted-foreground tabular-nums">
            {metaLine(task, context)}
          </p>
          {task.status === 'issue' && task.issueNote ? (
            <p className="flex items-start gap-1.5 text-body-touch text-danger">
              <AlertTriangle
                className="mt-1 size-4 shrink-0"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              {task.issueNote}
            </p>
          ) : null}
        </div>
        <RowMenu label={`More for ${task.title}`} items={menu} />
      </div>
      <div className="flex gap-2">
        {task.vendor ? (
          <Button
            variant="outline"
            className="h-12 gap-2 px-4 text-body-touch sunlight:border-2"
            aria-label={`Call ${task.vendor.name}`}
            onClick={() => {
              onCall(task);
            }}
          >
            <Phone className="size-6" strokeWidth={1.5} aria-hidden="true" />
            Call
          </Button>
        ) : null}
        <Button
          variant="outline"
          className="h-12 px-4 text-body-touch sunlight:border-2"
          aria-label={`Mark “${task.title}” as issue`}
          onClick={() => {
            actions.markIssue(task);
          }}
        >
          Issue
        </Button>
        <Button
          className="h-12 flex-1 gap-2 text-body-touch"
          aria-label={`Mark “${task.title}” done`}
          disabled={settling}
          onClick={markDone}
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(settling && 'animate-check-draw')}
            />
          </svg>
          Done
        </Button>
      </div>
    </li>
  );
}
