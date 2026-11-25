import { Link } from 'react-router';
import { formatINR } from '@/lib/format';
import type { EventDetail } from '../api/events.schema';

type QuickCountsProps = { event: EventDetail };

/** S6 quick counts (spec §10): services planned and planned ₹ vs the overall budget. */
export function QuickCounts({ event }: QuickCountsProps) {
  const { services, planned } = event.plan;
  const budget = event.overallBudget;
  const over = budget !== null && planned > budget;

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
        <dt className="text-label text-muted-foreground">Services planned</dt>
        <dd className="flex items-baseline justify-between gap-2">
          <span className="text-heading tabular-nums">{services}</span>
          <Link
            to={`/events/${event.id}/plan`}
            className="text-label underline decoration-gold underline-offset-4"
          >
            Open plan
          </Link>
        </dd>
      </div>
      <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
        <dt className="text-label text-muted-foreground">Planned</dt>
        <dd className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-heading tabular-nums">{formatINR(planned)}</span>
          <span className={over ? 'text-label text-danger' : 'text-label text-muted-foreground'}>
            {budget === null
              ? 'No overall budget'
              : over
                ? `⚠ ${formatINR(planned - budget)} over ${formatINR(budget)}`
                : `of ${formatINR(budget)} · ${formatINR(budget - planned)} left`}
          </span>
        </dd>
      </div>
    </dl>
  );
}
