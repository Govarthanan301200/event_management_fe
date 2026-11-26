import type { Dashboard } from '../api/dashboard.schema';
import { links, moreCount, overLines, spanLabel } from '../lib/dashboard';
import { RowLink, WidgetCard } from './widget-card';

type OverBudgetWidgetProps = { overBudget: Dashboard['overBudget']; className?: string };

/**
 * Spec §15 widget 5: open events, whatever their date, with planned above the overall budget or a
 * category above its envelope (decision 2026-11-26). Opens S10, where the two are compared.
 * Design system: only the figure and its word are danger, never the whole row.
 */
export function OverBudgetWidget({ overBudget, className }: OverBudgetWidgetProps) {
  return (
    <WidgetCard
      id="dashboard-over-budget"
      title="Over budget"
      className={className}
      count={overBudget.total}
      isEmpty={overBudget.total === 0}
      empty="Every event is within its budget and envelopes."
      more={{ count: moreCount(overBudget), to: '/events', label: 'Events' }}
    >
      <ul className="divide-y divide-border">
        {overBudget.items.map((event) => (
          <RowLink key={event.eventId} to={links.summary(event.eventId)}>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-body font-semibold">{event.name}</span>
              <span className="text-caption text-muted-foreground tabular-nums">
                {spanLabel(event.firstFunctionDate, event.lastFunctionDate)}
              </span>
            </span>
            <span className="flex flex-col items-start gap-0.5 sm:items-end">
              {overLines(event.overBy, event.categoriesOver).map((line) => (
                <span key={line} className="text-figure text-danger">
                  ⚠ {line}
                </span>
              ))}
            </span>
            <span className="text-label text-muted-foreground max-sm:hidden" aria-hidden="true">
              Summary →
            </span>
          </RowLink>
        ))}
      </ul>
    </WidgetCard>
  );
}
