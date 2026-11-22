import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ClientFormSection } from '../api/client-form.schema';
import { ServiceOption } from './service-option';

type CategorySectionProps = {
  section: ClientFormSection;
  selectedCount: number;
  defaultOpen: boolean;
};

/** Collapsible category with a live "N selected" count in its header (spec §7). */
export function CategorySection({ section, selectedCount, defaultOpen }: CategorySectionProps) {
  const headingId = `section-${section.id}`;
  return (
    <Collapsible defaultOpen={defaultOpen} asChild>
      <section aria-labelledby={headingId} className="flex flex-col">
        <h2 id={headingId}>
          <CollapsibleTrigger className="group flex h-12 w-full items-center justify-between gap-3 text-left">
            <span className="text-overline text-muted-foreground">{section.name}</span>
            <span className="flex items-center gap-2 text-label text-muted-foreground">
              {selectedCount} selected
              <ChevronDown
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-5 transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </span>
          </CollapsibleTrigger>
        </h2>
        <CollapsibleContent>
          <ul className="flex flex-col gap-3 pb-6">
            {section.services.map((service) => (
              <ServiceOption key={service.id} service={service} />
            ))}
          </ul>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
