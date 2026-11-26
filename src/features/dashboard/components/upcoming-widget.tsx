import { Meter } from '@/components/shared/meter';
import { TaskTag } from '@/features/tasks';
import { formatINRCompact } from '@/lib/format';
import type { Dashboard, UpcomingEvent } from '../api/dashboard.schema';
import { categoriesOverLabel, links, moneyLabel, moreCount, spanLabel } from '../lib/dashboard';
import { RowLink, WidgetCard } from './widget-card';

type UpcomingWidgetProps = { upcoming: Dashboard['upcoming']; className?: string };

/**
 * Spec §15 widget 4: open events in the next 60 days (underway ones too), soonest first, each with
 * planned ₹ against its budget and its open tasks; opens S6. Dataviz: one ratio per named row is a
 * meter list (shared `Meter`, gold, danger once over); the figure beside it carries the numbers.
 */
export function UpcomingWidget({ upcoming, className }: UpcomingWidgetProps) {
  return (
    <WidgetCard
      id="dashboard-upcoming"
      title="Upcoming events · next 60 days"
      className={className}
      count={upcoming.total}
      isEmpty={upcoming.total === 0}
      empty="No events in the next 60 days."
      more={{ count: moreCount(upcoming), to: '/events', label: 'Events' }}
    >
      <ul className="divide-y divide-border">
        {upcoming.items.map((event) => (
          <UpcomingRow key={event.eventId} event={event} />
        ))}
      </ul>
    </WidgetCard>
  );
}

function UpcomingRow({ event }: { event: UpcomingEvent }) {
  const categories = categoriesOverLabel(event.categoriesOver);
  return (
    <RowLink
      to={links.event(event.eventId)}
      className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_8rem] sm:gap-x-6"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-body font-semibold">{event.name}</span>
        <span className="text-caption text-muted-foreground tabular-nums">
          {spanLabel(event.firstFunctionDate, event.lastFunctionDate)}
        </span>
      </span>
      <span className="flex flex-col gap-1.5">
        {event.overallBudget === null ? null : (
          <Meter value={event.planned} max={event.overallBudget} />
        )}
        <span className="text-figure text-muted-foreground sm:text-right">
          {moneyLabel(event.planned, event.overallBudget)}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
        <span className="text-caption text-muted-foreground tabular-nums">
          {openTasksLabel(event.openTasks)}
        </span>
        {event.overBy === null ? null : (
          <TaskTag tone="danger">⚠ {formatINRCompact(event.overBy)} over</TaskTag>
        )}
        {categories === null ? null : <TaskTag tone="danger">⚠ {categories}</TaskTag>}
      </span>
    </RowLink>
  );
}

function openTasksLabel(count: number): string {
  if (count === 0) return 'No open tasks';
  return count === 1 ? '1 open task' : `${String(count)} open tasks`;
}
