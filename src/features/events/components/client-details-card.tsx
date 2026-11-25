import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/format';
import type { EventDetail } from '../api/events.schema';

type ClientDetailsCardProps = { event: EventDetail; onEdit: () => void };

/** S6 client details and overall budget (spec §10). */
export function ClientDetailsCard({ event, onEdit }: ClientDetailsCardProps) {
  return (
    <section
      aria-labelledby="client-details-heading"
      className="flex flex-col gap-4 rounded-md border border-border bg-card p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="client-details-heading" className="text-heading">
          Client details
        </h2>
        <Button variant="outline" className="h-10 px-4" onClick={onEdit}>
          Edit details
        </Button>
      </div>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        <Detail term="Client">{event.clientName}</Detail>
        <Detail term="Phone">
          <a
            href={`tel:${event.clientPhone.replace(/[^\d+]/g, '')}`}
            className="text-foreground underline decoration-gold underline-offset-4"
          >
            {event.clientPhone}
          </a>
        </Detail>
        <Detail term="Email">{event.clientEmail ?? <Muted>Not added</Muted>}</Detail>
        <Detail term="Overall budget">
          {event.overallBudget === null ? (
            <Muted>Not set</Muted>
          ) : (
            <span className="tabular-nums">{formatINR(event.overallBudget)}</span>
          )}
        </Detail>
      </dl>
    </section>
  );
}

type DetailProps = { term: string; children: ReactNode };

function Detail({ term, children }: DetailProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-label text-muted-foreground">{term}</dt>
      <dd className="truncate text-body">{children}</dd>
    </div>
  );
}

type MutedProps = { children: ReactNode };

function Muted({ children }: MutedProps) {
  return <span className="text-muted-foreground">{children}</span>;
}
