import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ClientForm } from '../api/client-form.schema';
import { ClientFormHeader } from './client-form-header';

type ThankYouProps = { company: ClientForm['company']; selectedCount: number; onEdit: () => void };

/** The one place exclamation marks are allowed (design system: Voice). */
export function ThankYou({ company, selectedCount, onEdit }: ThankYouProps) {
  return (
    <div className="flex flex-col gap-6 pb-16">
      <ClientFormHeader company={company} title="Thank you! Your planner has your list.">
        <p className="text-body-touch text-muted-foreground">
          You picked {selectedCount} {selectedCount === 1 ? 'service' : 'services'}. {company.name}{' '}
          will be in touch. You can open this link again to change your answers until they close the
          form.
        </p>
      </ClientFormHeader>
      <Button variant="outline" onClick={onEdit} className="h-12 self-start px-5 text-body-touch">
        Change my answers
      </Button>
    </div>
  );
}

type LockedSummaryProps = { form: ClientForm };

/** Spec §7: once locked, the link shows a read-only summary. */
export function LockedSummary({ form }: LockedSummaryProps) {
  const chosen = new Map(form.selections.map((selection) => [selection.serviceId, selection.note]));
  const sections = form.sections
    .map((section) => ({
      ...section,
      services: section.services.filter((service) => chosen.has(service.id)),
    }))
    .filter((section) => section.services.length > 0);

  return (
    <div className="flex flex-col gap-8 pb-16">
      <ClientFormHeader company={form.company} title="Your wedding list">
        <p className="text-body-touch text-muted-foreground">
          {form.company.name} has closed this form. To change something, contact your planner.
        </p>
      </ClientFormHeader>
      {sections.length === 0 ? (
        <p className="text-body-touch text-muted-foreground">No services were sent on this form.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <section key={section.id} aria-label={section.name} className="flex flex-col gap-2">
              <h2 className="text-overline text-muted-foreground">{section.name}</h2>
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
                {section.services.map((service) => (
                  <li key={service.id} className="flex flex-col gap-1 p-4">
                    <span className="text-body-touch font-semibold">{service.name}</span>
                    {chosen.get(service.id) ? (
                      <span className="text-body text-muted-foreground">
                        {chosen.get(service.id)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** Same page for a malformed, unknown or replaced link: it reveals nothing about any event. */
export function LinkUnavailable() {
  return (
    <div className="flex flex-col gap-3 py-16">
      <h1 className="text-title-serif">This link isn&apos;t available</h1>
      <p className="text-body-touch text-muted-foreground">
        Ask your planner to send it to you again.
      </p>
    </div>
  );
}

type LoadFailedProps = { onRetry: () => void };

export function LoadFailed({ onRetry }: LoadFailedProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 py-16">
      <h1 className="text-title-serif">We couldn&apos;t load your form</h1>
      <p className="text-body-touch text-muted-foreground">Check your connection and try again.</p>
      <Button onClick={onRetry} className="h-12 px-5 text-body-touch">
        Try again
      </Button>
    </div>
  );
}

export function ClientFormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your form" className="flex flex-col gap-4 pt-12">
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="mt-6 h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
