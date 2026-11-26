import { TaskTag } from '@/features/tasks';
import type { Dashboard, DashboardTask } from '../api/dashboard.schema';
import { dueLabel, links, moreCount, taskContext } from '../lib/dashboard';
import { RowLink, WidgetCard } from './widget-card';

type TasksWidgetProps = { tasks: Dashboard['tasks']; today: string; className?: string };

type Kind = 'issue' | 'overdue' | 'week';

/**
 * Spec §15 widget 2 "Overdue and due this week", across events: open Issues pinned first, then
 * overdue (any age, decision 2026-11-26), then the rest of the week. Each row opens S11 on it.
 */
export function TasksWidget({ tasks, today, className }: TasksWidgetProps) {
  const { issues, overdue, thisWeek } = tasks;
  const total = issues.total + overdue.total + thisWeek.total;
  const hidden = moreCount(issues) + moreCount(overdue);
  return (
    <WidgetCard
      id="dashboard-tasks"
      title="Overdue and due this week"
      className={className}
      count={total}
      isEmpty={total === 0}
      empty="Nothing overdue and nothing due this week."
      more={{ count: moreCount(thisWeek), to: '/upcoming', label: 'Upcoming' }}
    >
      <ul className="divide-y divide-border">
        {issues.items.map((task) => (
          <TaskLine key={task.id} task={task} kind="issue" today={today} />
        ))}
        {overdue.items.map((task) => (
          <TaskLine key={task.id} task={task} kind="overdue" today={today} />
        ))}
        {thisWeek.items.map((task) => (
          <TaskLine key={task.id} task={task} kind="week" today={today} />
        ))}
      </ul>
      {hidden > 0 ? (
        <p className="border-t border-border px-4 py-3 text-caption text-muted-foreground">
          <span className="tabular-nums">{hidden}</span> more overdue or with an issue, on their
          events&apos; Tasks tabs
        </p>
      ) : null}
    </WidgetCard>
  );
}

type TaskLineProps = { task: DashboardTask; kind: Kind; today: string };

function TaskLine({ task, kind, today }: TaskLineProps) {
  return (
    <RowLink to={links.task(task)} className="flex-nowrap items-start">
      <span className="flex w-28 shrink-0 flex-col items-start gap-1 pt-0.5">
        {kind === 'issue' ? <TaskTag tone="danger">⚠ Issue</TaskTag> : null}
        {kind === 'overdue' ? <TaskTag tone="danger">⚠ Overdue</TaskTag> : null}
        {kind === 'issue' ? null : (
          <span className="text-caption text-muted-foreground tabular-nums">
            {dueLabel(task, today)}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-semibold">{task.title}</span>
        <span className="truncate text-caption text-muted-foreground">{taskContext(task)}</span>
        {kind === 'issue' && task.issueNote ? (
          <span className="text-caption text-danger">⚠ {task.issueNote}</span>
        ) : null}
      </span>
    </RowLink>
  );
}
