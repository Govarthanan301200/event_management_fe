import { Check } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { CountedItem } from '../lib/directory';

type ServiceFilterChipsProps = {
  /** Vendors in the category (the "All" chip). */
  total: number;
  chips: CountedItem[];
  selectedId: string | undefined;
  onSelect: (serviceId: string | null) => void;
};

const ALL = '__all__';

/**
 * S3 service filter (spec §9): one chip per service that has vendors, with counts. Selecting a
 * chip shows only vendors offering that service. Selected = gold border + gold-soft + check.
 */
export function ServiceFilterChips({
  total,
  chips,
  selectedId,
  onSelect,
}: ServiceFilterChipsProps) {
  if (chips.length === 0) return null;
  const value = selectedId ?? ALL;
  return (
    <ToggleGroup
      type="single"
      value={value}
      aria-label="Filter by service"
      className="flex-wrap justify-start gap-2"
      onValueChange={(next) => {
        // Clicking the selected chip again clears the service filter.
        onSelect(next === '' || next === ALL ? null : next);
      }}
    >
      <Chip value={ALL} name="All" count={total} on={value === ALL} />
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          value={chip.id}
          name={chip.name}
          count={chip.count}
          on={value === chip.id}
        />
      ))}
    </ToggleGroup>
  );
}

type ChipProps = { value: string; name: string; count: number; on: boolean };

function Chip({ value, name, count, on }: ChipProps) {
  return (
    <ToggleGroupItem
      value={value}
      aria-label={`${name}, ${count === 1 ? '1 vendor' : `${count} vendors`}`}
      className="h-8 rounded-full border border-input px-3 text-label text-muted-foreground transition-colors duration-200 data-[state=on]:border-gold data-[state=on]:bg-gold-soft data-[state=on]:text-foreground"
    >
      {on ? <Check className="size-3.5" strokeWidth={1.5} aria-hidden="true" /> : null}
      <span>{name}</span>
      <span className="tabular-nums">{count}</span>
    </ToggleGroupItem>
  );
}
