import { formatINR } from '@/lib/format';
import type { EventDetail } from '../api/events.schema';
import { EventActionsMenu } from './event-actions-menu';
import { EventStatusBadge } from './event-status-badge';

type EventHeaderProps = { event: EventDetail; onEditDetails: () => void };

/** Event header: name, status, client and budget, and the ⋯ menu. The workspace adds tabs and the gold hairline. */
export function EventHeader({ event, onEditDetails }: EventHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="text-headline font-display">{event.name}</h1>
          <EventStatusBadge status={event.status} />
        </div>
        <EventActionsMenu event={event} onEditDetails={onEditDetails} />
      </div>
      <p className="text-body text-muted-foreground">
        {event.clientName} · {event.clientPhone} ·{' '}
        {event.overallBudget === null ? (
          'Budget not set'
        ) : (
          <>
            Budget <span className="tabular-nums">{formatINR(event.overallBudget)}</span>
          </>
        )}
      </p>
    </header>
  );
}
