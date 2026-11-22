import type { EventDetail } from '../api/events.schema';

type RequestedServicesPanelProps = { event: EventDetail };

/**
 * S6 "Requested by client" (spec §7). SPEC-GAP: Planned / Not planned and "add to plan" need
 * service lines (milestone 5). Until then every request is truthfully Not planned.
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
              <span className="shrink-0 text-label text-muted-foreground">○ Not planned</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
