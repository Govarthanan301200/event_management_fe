import { Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { pickableCategories } from '../lib/catalogue-index';

type PickerCategory = ReturnType<typeof pickableCategories>[number];

type ServicePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PickerCategory[];
  /** Service ids currently on the form. */
  selected: ReadonlySet<string>;
  onApply: (selected: Set<string>) => void;
};

/**
 * Spec §9 part 3: pick services from any category (core rule 2: a vendor links to services,
 * never to categories). Only active services are offered (decision 2026-11-24).
 */
export function ServicePickerDialog({ open, onOpenChange, ...rest }: ServicePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 sm:max-w-xl">
        {/* Mounted only while open, so the selection starts from the form each time. */}
        {open ? (
          <PickerBody
            {...rest}
            onCancel={() => {
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type PickerBodyProps = Omit<ServicePickerDialogProps, 'open' | 'onOpenChange'> & {
  onCancel: () => void;
};

function PickerBody({ categories, selected, onApply, onCancel }: PickerBodyProps) {
  const [chosen, setChosen] = useState(() => new Set(selected));
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const visible = categories
    .map((category) => ({
      ...category,
      services: category.name.toLowerCase().includes(term)
        ? category.services
        : category.services.filter((service) => service.name.toLowerCase().includes(term)),
    }))
    .filter((category) => category.services.length > 0);

  const toggle = (id: string, on: boolean) => {
    setChosen((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-title-serif">Services offered</DialogTitle>
        <DialogDescription>
          Tick every service this vendor offers. They&apos;ll appear under each of those categories.
        </DialogDescription>
      </DialogHeader>
      <div className="relative">
        <label htmlFor="service-search" className="sr-only">
          Search services
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Input
          id="service-search"
          type="search"
          value={search}
          placeholder="Search services"
          className="h-10 pl-9"
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />
      </div>
      <div className="-mx-6 min-h-0 flex-1 overflow-y-auto border-y border-border px-6 py-3">
        {visible.length === 0 ? (
          <p className="py-6 text-body text-muted-foreground">
            No services match “{search.trim()}”.
          </p>
        ) : (
          visible.map((category) => (
            <fieldset key={category.id} className="flex flex-col gap-1 py-2">
              <legend className="pb-1 text-overline text-muted-foreground">{category.name}</legend>
              {category.services.map((service) => {
                const id = `pick-${service.id}`;
                return (
                  <div
                    key={service.id}
                    className="flex min-h-8 items-center gap-3 rounded-sm px-1 hover:bg-accent"
                  >
                    <Checkbox
                      id={id}
                      checked={chosen.has(service.id)}
                      onCheckedChange={(checked) => {
                        toggle(service.id, checked === true);
                      }}
                    />
                    <label htmlFor={id} className="flex-1 cursor-pointer py-1 text-body">
                      {service.name}
                    </label>
                  </div>
                );
              })}
            </fieldset>
          ))
        )}
      </div>
      <DialogFooter className="items-center gap-3 sm:justify-between">
        <span className="text-label text-muted-foreground" aria-live="polite">
          {chosen.size === 1 ? '1 service selected' : `${chosen.size} services selected`}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(chosen);
            }}
          >
            Save selection
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
