import { Phone } from 'lucide-react';
import { phoneSheetClass } from '@/components/shared/phone-sheet';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AgendaTask, AgendaVendor } from '../api/agenda.schema';

type CallSheetProps = { task: AgendaTask & { vendor: AgendaVendor }; onClose: () => void };

type Number = { id: string; who: string; role: string | null; phone: string };

function numbersOf(vendor: AgendaVendor): Number[] {
  const main: Number[] = [
    {
      id: 'main',
      who: vendor.contactPerson ?? vendor.name,
      role: 'Main number',
      phone: vendor.phone,
    },
  ];
  const alt: Number[] = vendor.altPhone
    ? [{ id: 'alt', who: vendor.name, role: 'Other number', phone: vendor.altPhone }]
    : [];
  const team = vendor.contacts.map((contact) => ({
    id: contact.id,
    who: contact.name,
    role: contact.role,
    phone: contact.phone,
  }));
  return [...main, ...alt, ...team];
}

/** Spec §14 Call: the vendor's contacts list (cached for offline); a tap dials. */
export function CallSheet({ task, onClose }: CallSheetProps) {
  const { vendor } = task;
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className={cn('gap-2 rounded-t-lg px-4 sm:mx-auto sm:max-w-md', phoneSheetClass)}
      >
        <SheetHeader className="px-0">
          <SheetTitle className="text-title-serif">Call {vendor.name}</SheetTitle>
          <SheetDescription>{task.serviceName ?? task.title}</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col divide-y divide-border">
          {numbersOf(vendor).map((number) => (
            <li key={number.id}>
              <a
                href={`tel:${number.phone.replace(/\s+/g, '')}`}
                className="flex min-h-14 items-center gap-3 rounded-sm px-1 py-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Phone
                  className="size-6 shrink-0 text-muted-foreground"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body-touch font-semibold">{number.who}</span>
                  {number.role ? (
                    <span className="text-caption text-muted-foreground">{number.role}</span>
                  ) : null}
                </span>
                <span className="text-body-touch tabular-nums">{number.phone}</span>
              </a>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
