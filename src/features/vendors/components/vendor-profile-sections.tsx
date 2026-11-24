import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import type { VendorDetail } from '../api/vendors.schema';
import { formatRate } from '../lib/rate-suggestion';
import { PhoneLink } from './phone-link';

type SectionProps = { title: string; aside?: ReactNode; children: ReactNode };

function Section({ title, aside, children }: SectionProps) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="rounded-md border border-border bg-card">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3">
        <h2 id={id} className="text-overline text-muted-foreground">
          {title}
        </h2>
        {aside}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

type FactProps = { label: string; children: ReactNode };

function Fact({ label, children }: FactProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="text-body break-words">{children}</dd>
    </div>
  );
}

const none = <span className="text-subtle-foreground">—</span>;

type VendorProps = { vendor: VendorDetail };

/** Spec §9 part 1. Phones are click-to-call, the main phone also offers WhatsApp. */
export function BasicInfoSection({ vendor }: VendorProps) {
  return (
    <Section title="Basic information">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Point of contact">{vendor.contactPerson ?? none}</Fact>
        <Fact label="Phone">
          <PhoneLink phone={vendor.phone} withWhatsApp />
        </Fact>
        <Fact label="Alternate phone">
          {vendor.altPhone ? <PhoneLink phone={vendor.altPhone} /> : none}
        </Fact>
        <Fact label="City">{vendor.city ?? none}</Fact>
        <Fact label="Address">
          {vendor.address ? <span className="whitespace-pre-line">{vendor.address}</span> : none}
        </Fact>
        <Fact label="Portfolio">
          {vendor.portfolioUrl ? <PortfolioLink url={vendor.portfolioUrl} /> : none}
        </Fact>
      </dl>
    </Section>
  );
}

type PortfolioLinkProps = { url: string };

/** The one portfolio link (spec §1 scope). The server only stores http(s) links. */
function PortfolioLink({ url }: PortfolioLinkProps) {
  const shown = url.replace(/^https?:\/\//, '');
  return (
    <a
      href={url}
      aria-label={`${shown} (opens in a new tab)`}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-gold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {shown}
    </a>
  );
}

type TeamSectionProps = { contacts: VendorDetail['contacts'] };

/** Spec §9 part 2: team contacts for one-tap calls on the day. */
export function TeamSection({ contacts }: TeamSectionProps) {
  return (
    <Section title="Team">
      {contacts.length === 0 ? (
        <p className="text-body text-muted-foreground">No team contacts yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex flex-col gap-0.5">
              <span className="text-body font-semibold">
                {contact.name}
                {contact.role ? (
                  <span className="font-normal text-muted-foreground"> · {contact.role}</span>
                ) : null}
              </span>
              <PhoneLink phone={contact.phone} className="text-label" />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Spec §9 part 3: every service offered, with its optional rate. Archived links stay, marked. */
export function ServicesSection({ vendor }: VendorProps) {
  return (
    <Section
      title="Services and rates"
      aside={<span className="text-caption text-muted-foreground">Rates are optional</span>}
    >
      <ul className="flex flex-col divide-y divide-border">
        {vendor.services.map((service) => (
          <li
            key={service.serviceId}
            className="grid grid-cols-1 gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"
          >
            <div className="flex min-w-0 flex-col">
              <span className="flex flex-wrap items-center gap-2 text-body font-semibold">
                {service.serviceName}
                {service.archived ? (
                  <Badge
                    variant="outline"
                    className="rounded-sm text-caption text-muted-foreground"
                  >
                    Archived
                  </Badge>
                ) : null}
              </span>
              <span className="text-caption text-muted-foreground">{service.categoryName}</span>
            </div>
            <div className="flex flex-col sm:items-end">
              {service.rateAmount !== null && service.rateBasis !== null ? (
                <span className="text-figure tabular-nums">
                  {formatRate(service.rateAmount, service.rateBasis)}
                </span>
              ) : (
                <span className="text-label text-muted-foreground">
                  No rate ·{' '}
                  <Link
                    to={`/vendors/${vendor.id}/edit`}
                    aria-label={`Add rate for ${service.serviceName}`}
                    className="text-gold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Add rate
                  </Link>
                </span>
              )}
              {service.rateNote ? (
                <span className="text-caption text-muted-foreground">{service.rateNote}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

type NotesSectionProps = { notes: string | null };

/** Spec §9 part 4: private planner notes. */
export function NotesSection({ notes }: NotesSectionProps) {
  return (
    <Section title="Planner notes">
      {notes ? (
        <p className="text-body whitespace-pre-line">{notes}</p>
      ) : (
        <p className="text-body text-muted-foreground">No notes yet.</p>
      )}
    </Section>
  );
}
