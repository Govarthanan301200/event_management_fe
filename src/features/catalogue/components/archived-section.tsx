import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ArchivedSectionProps = {
  /** "Archived services", "Archived function types". */
  title: string;
  items: { id: string; name: string }[];
  onRestore: (item: { id: string; name: string }) => void;
};

/** Archived items, collapsed by default, each with Restore (spec §8: archive and restore). */
export function ArchivedSection({ title, items, onRestore }: ArchivedSectionProps) {
  if (items.length === 0) return null;
  return (
    <Collapsible className="flex flex-col gap-2">
      <CollapsibleTrigger className="group flex items-center gap-1 self-start rounded-sm text-label text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <ChevronRight
          className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-90"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        {title} ({items.length})
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="divide-y divide-border rounded-md border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-2">
              <span className="min-w-0 truncate text-body text-muted-foreground">{item.name}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Restore ${item.name}`}
                onClick={() => {
                  onRestore(item);
                }}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
