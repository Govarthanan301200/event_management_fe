import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateRange } from '@/lib/format';
import type { EventSummary, EventView } from '../api/events.schema';
import { useEventList } from '../hooks/use-event-list';
import { EventStatusBadge } from './event-status-badge';

type EventListProps = { view: EventView };

export function EventList({ view }: EventListProps) {
  const query = useEventList(view);

  if (query.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading events" className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-body text-danger">⚠ Couldn&apos;t load your events.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const events = query.data.pages.flatMap((page) => page.data);
  if (events.length === 0) return <EmptyList view={view} />;

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              to={`/events/${event.id}`}
              className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-body font-semibold">{event.name}</span>
                <span className="text-caption text-muted-foreground">{describe(event)}</span>
              </span>
              <EventStatusBadge status={event.status} />
            </Link>
          </li>
        ))}
      </ul>
      {query.hasNextPage ? (
        <Button
          variant="outline"
          className="self-start"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Show more events'}
        </Button>
      ) : null}
    </div>
  );
}

/** "Priya · 12–14 Feb 2027 · 4 functions", or "Priya · No functions yet". */
function describe(event: EventSummary): string {
  if (event.firstFunctionDate === null || event.lastFunctionDate === null) {
    return `${event.clientName} · No functions yet`;
  }
  const count = `${event.functionCount} ${event.functionCount === 1 ? 'function' : 'functions'}`;
  return `${event.clientName} · ${formatDateRange(event.firstFunctionDate, event.lastFunctionDate)} · ${count}`;
}

function EmptyList({ view }: EventListProps) {
  return view === 'upcoming' ? (
    <div className="flex flex-col gap-2 py-16">
      <h2 className="text-title-serif">No upcoming events</h2>
      <p className="text-body text-muted-foreground">
        Create an event with the client&apos;s name and phone. You&apos;ll get a form link to send
        them straight away.
      </p>
    </div>
  ) : (
    <div className="flex flex-col gap-2 py-16">
      <h2 className="text-title-serif">No past events yet</h2>
      <p className="text-body text-muted-foreground">
        Events move here the day after their last function, or when you mark them completed or
        cancelled.
      </p>
    </div>
  );
}
