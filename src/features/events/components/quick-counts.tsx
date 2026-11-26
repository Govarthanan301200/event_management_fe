import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { summaryOptions } from '@/features/summary';
import { formatINR } from '@/lib/format';
import type { EventDetail } from '../api/events.schema';

type QuickCountsProps = { event: EventDetail };

/**
 * S6 quick counts (spec §10): services planned, open tasks, and planned ₹ vs the overall budget.
 * The money comes from the server's spec §12 roll-up (decision 2026-11-26), like S7, S9 and S10;
 * the open-task count rides on the event detail.
 */
export function QuickCounts({ event }: QuickCountsProps) {
  const summary = useQuery(summaryOptions(event.id));

  if (summary.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading plan figures" className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-md" />
        <Skeleton className="h-20 rounded-md" />
        <Skeleton className="h-20 rounded-md" />
      </div>
    );
  }
  if (summary.isError) {
    return (
      <div role="alert" className="flex items-center gap-3 rounded-md border border-border p-4">
        <p className="text-body text-muted-foreground">Couldn't load the plan figures.</p>
        <Button variant="outline" size="sm" onClick={() => void summary.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { services, planned, overallBudget: budget, left } = summary.data;
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
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
        <dt className="text-label text-muted-foreground">Open tasks</dt>
        <dd className="flex items-baseline justify-between gap-2">
          <span className="text-heading tabular-nums">{event.openTasks}</span>
          <Link
            to={`/events/${event.id}/tasks`}
            className="text-label underline decoration-gold underline-offset-4"
          >
            View tasks
          </Link>
        </dd>
      </div>
      <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
        <dt className="text-label text-muted-foreground">Planned</dt>
        <dd className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-heading tabular-nums">{formatINR(planned)}</span>
          <BudgetNote budget={budget} left={left} />
        </dd>
      </div>
    </dl>
  );
}

type BudgetNoteProps = { budget: number | null; left: number | null };

function BudgetNote({ budget, left }: BudgetNoteProps) {
  if (budget === null || left === null) {
    return <span className="text-label text-muted-foreground">No overall budget</span>;
  }
  if (left < 0) {
    return (
      <span className="text-label text-danger">
        ⚠ {formatINR(-left)} over {formatINR(budget)}
      </span>
    );
  }
  return (
    <span className="text-label text-muted-foreground">
      of {formatINR(budget)} · {formatINR(left)} left
    </span>
  );
}
