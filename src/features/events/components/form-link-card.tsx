import { Copy, Lock, LockOpen, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { formLinkFor } from '../api/events.api';
import type { EventDetail } from '../api/events.schema';
import { useSetFormLocked } from '../hooks/use-event-mutations';
import { useShareLink } from '../hooks/use-share-link';

type FormLinkCardProps = { event: EventDetail };

/** S6 "Form link": Copy, Share and Lock form, plus submission status (spec §10). */
export function FormLinkCard({ event }: FormLinkCardProps) {
  const link = formLinkFor(event.formToken);
  const { copy, share } = useShareLink(link, event.clientName);
  const lock = useSetFormLocked(event.id);

  return (
    <section
      aria-labelledby="form-link-heading"
      className="flex flex-col gap-4 rounded-md border border-border bg-card p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="form-link-heading" className="text-heading">
          Client form link
        </h2>
        <p className="text-label text-muted-foreground">
          {event.formSubmittedAt
            ? `Submitted ${formatDateTime(event.formSubmittedAt)}`
            : 'Not submitted yet'}
          {event.formLocked ? ' · Locked' : ''}
        </p>
      </div>

      <p className="truncate rounded-sm bg-muted px-3 py-2 font-mono text-label" title={link}>
        {link}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void share()} className="h-10 px-4">
          <Share2 strokeWidth={1.5} aria-hidden="true" />
          Share link
        </Button>
        <Button variant="outline" onClick={() => void copy()} className="h-10 px-4">
          <Copy strokeWidth={1.5} aria-hidden="true" />
          Copy link
        </Button>
        <Button
          variant="ghost"
          disabled={lock.isPending}
          onClick={() => {
            lock.mutate(!event.formLocked);
          }}
          className="h-10 px-4"
        >
          {event.formLocked ? (
            <LockOpen strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Lock strokeWidth={1.5} aria-hidden="true" />
          )}
          {event.formLocked ? 'Unlock form' : 'Lock form'}
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">
        {event.formLocked
          ? 'The client sees a read-only summary of what they sent.'
          : 'The client can reopen the link and change their answers until you lock the form.'}
      </p>
      {lock.isError ? (
        <p role="alert" className="text-label text-danger">
          ⚠ Couldn&apos;t change the form. Try again.
        </p>
      ) : null}
    </section>
  );
}
