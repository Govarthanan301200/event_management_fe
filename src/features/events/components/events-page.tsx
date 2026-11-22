import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { useEventList } from '../hooks/use-event-list';
import { CreateEventDialog } from './create-event-dialog';
import { EventStatusBadge } from './event-status-badge';

/** S5 event list. SPEC-GAP: upcoming/past split needs function dates (milestone 4); newest first for now. */
export function EventsPage() {
  const query = useEventList();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-headline">Events</h1>
        <CreateEventDialog />
      </div>
      <EventList query={query} />
    </div>
  );
}

type EventListProps = { query: ReturnType<typeof useEventList> };

function EventList({ query }: EventListProps) {
  if (query.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading events" className="flex flex-col gap-2">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
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
  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-16">
        <h2 className="text-title-serif">Create your first event</h2>
        <p className="text-body text-muted-foreground">
          All you need is the client&apos;s name and phone. You&apos;ll get a form link to send them
          straight away.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              to={`/events/${event.id}`}
              className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted"
            >
              <span className="flex flex-col">
                <span className="text-body font-semibold">{event.name}</span>
                <span className="text-caption text-muted-foreground">
                  {event.formSubmittedAt
                    ? `Client sent their list on ${formatDate(event.formSubmittedAt)}`
                    : `Created ${formatDate(event.createdAt)} · form not sent yet`}
                </span>
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
