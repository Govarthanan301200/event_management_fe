import { Button } from '@/components/ui/button';
import type { EventDetail } from '@/features/events';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

type PlanSummaryProps = { event: EventDetail; planned: number; onAdd: () => void };

const guests = new Intl.NumberFormat('en-IN');

/** S7 top: planned of budget, the one primary action, and the sticky function strip. */
export function PlanSummary({ event, planned, onAdd }: PlanSummaryProps) {
  const budget = event.overallBudget;
  const over = budget !== null && planned > budget;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body">
          Planned <span className="text-figure tabular-nums">{formatINR(planned)}</span>
          {budget === null ? (
            <span className="text-muted-foreground"> · No overall budget</span>
          ) : (
            <>
              <span className="text-muted-foreground"> of {formatINR(budget)} · </span>
              <span
                className={cn(
                  'tabular-nums',
                  over ? 'font-medium text-danger' : 'text-muted-foreground',
                )}
              >
                {over
                  ? `⚠ ${formatINR(planned - budget)} over`
                  : `${formatINR(budget - planned)} left`}
              </span>
            </>
          )}
        </p>
        <Button className="h-10 px-4" onClick={onAdd}>
          Add service
        </Button>
      </div>
      <p
        aria-label="Functions and guests"
        className="sticky top-0 z-10 -mx-1 overflow-x-auto bg-background px-1 py-2 text-label whitespace-nowrap text-muted-foreground shadow-sticky"
      >
        {event.functions.map((fn, index) => (
          <span key={fn.id}>
            {index > 0 ? ' · ' : ''}
            <span className="text-foreground">{fn.name}</span>{' '}
            <span className="tabular-nums">{guests.format(fn.guestCount)}</span>
          </span>
        ))}
      </p>
    </>
  );
}
