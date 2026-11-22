import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { eventDetailOptions } from '../api/events.api';
import { EventStatusBadge } from './event-status-badge';
import { FormLinkCard } from './form-link-card';
import { RequestedServicesPanel } from './requested-services-panel';

/** S6 event overview: client, form link and what the client asked for. Functions come in milestone 4. */
export function EventOverviewPage() {
  const { eventId = '' } = useParams();
  const query = useQuery(eventDetailOptions(eventId));

  if (query.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading event" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-40 w-full rounded-md" />
      </div>
    );
  }
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-16">
        <h1 className="text-title-serif">
          {missing ? "This event doesn't exist" : "Couldn't load this event"}
        </h1>
        {missing ? (
          <Button asChild variant="outline">
            <Link to="/events">Back to events</Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  const event = query.data;
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-gold pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-headline font-display">{event.name}</h1>
          <EventStatusBadge status={event.status} />
        </div>
        <p className="text-body text-muted-foreground">
          Client: {event.clientName} · {event.clientPhone}
          {event.clientEmail ? ` · ${event.clientEmail}` : ''}
        </p>
      </header>
      <FormLinkCard event={event} />
      <RequestedServicesPanel event={event} />
    </div>
  );
}
