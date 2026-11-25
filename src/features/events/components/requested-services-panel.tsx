import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import type { EventDetail } from '../api/events.schema';

type RequestedServicesPanelProps = { event: EventDetail };

/**
 * S6 "Requested by client" (spec §7, §10). Planned once the event has a line for the service;
 * otherwise "Add to plan" opens the S8 drawer with the service chosen (spec §11 design ideas).
 */
export function RequestedServicesPanel({ event }: RequestedServicesPanelProps) {
  const requests = event.requestedServices;
  return (
    <section aria-labelledby="requested-heading" className="flex flex-col gap-4">
      <h2 id="requested-heading" className="text-heading">
        Requested by client {requests.length > 0 ? `(${requests.length})` : ''}
      </h2>
      {requests.length === 0 ? (
        <p className="text-body text-muted-foreground">
          Nothing yet. Send {event.clientName} the form link; the services they tick will appear
          here with their notes.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {requests.map((request) => (
            <li
              key={request.serviceId}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body font-semibold">{request.serviceName}</span>
                <span className="text-caption text-muted-foreground">{request.categoryName}</span>
                {request.clientNote ? (
                  <q className="text-body text-muted-foreground">{request.clientNote}</q>
                ) : null}
              </div>
              {request.planned ? (
                <span className="shrink-0 text-label text-success">✓ Planned</span>
              ) : (
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-label text-muted-foreground">○ Not planned</span>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={`/events/${event.id}/plan?add=${request.serviceId}`}
                      aria-label={`Add ${request.serviceName} to plan`}
                    >
                      Add to plan
                    </Link>
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
