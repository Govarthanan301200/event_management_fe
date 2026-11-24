import { MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { telHref, whatsAppHref } from '../lib/directory';

type PhoneLinkProps = {
  phone: string;
  /** Also offer a WhatsApp link (spec §9 design idea). */
  withWhatsApp?: boolean;
  className?: string;
};

/** Click-to-call (spec §9 design idea), with an optional WhatsApp link beside it. */
export function PhoneLink({ phone, withWhatsApp = false, className }: PhoneLinkProps) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <a
        href={telHref(phone)}
        aria-label={`Call ${phone}`}
        className="inline-flex items-center gap-1 text-gold tabular-nums underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Phone className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        <span>{phone}</span>
      </a>
      {withWhatsApp ? (
        <a
          href={whatsAppHref(phone)}
          aria-label={`WhatsApp ${phone} (opens in a new tab)`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-label text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <MessageCircle className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          WhatsApp
        </a>
      ) : null}
    </span>
  );
}
