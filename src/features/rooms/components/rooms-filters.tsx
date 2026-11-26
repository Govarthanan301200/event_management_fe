import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Hotel } from '../api/rooms.schema';
import { STATUS_LABELS } from '../lib/status';
import { isFiltered, NONE, type RoomsView } from '../lib/view';

const ALL = 'all';

type RoomsFiltersProps = {
  view: RoomsView;
  hotels: readonly Hotel[];
  onChange: (key: 'q' | 'hotel' | 'status', value: string | null) => void;
  onClear: () => void;
};

/** Spec §10 "Sort and filter by any column; quick filters for hotel and status", in one row. */
export function RoomsFilters({ view, hotels, onChange, onClear }: RoomsFiltersProps) {
  const pick = (key: 'hotel' | 'status') => (value: string) => {
    onChange(key, value === ALL ? null : value);
  };
  return (
    <div role="group" aria-label="Filter rows" className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Filter rows"
          placeholder="Filter…"
          value={view.q}
          onChange={(event) => {
            onChange('q', event.target.value === '' ? null : event.target.value);
          }}
          className="h-9 w-56 pl-8"
        />
      </div>
      <Select value={view.hotel ?? ALL} onValueChange={pick('hotel')}>
        <SelectTrigger aria-label="Hotel" className="h-9 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All hotels</SelectItem>
          {hotels.map((hotel) => (
            <SelectItem key={hotel.id} value={hotel.id}>
              {hotel.name}
            </SelectItem>
          ))}
          <SelectItem value={NONE}>No hotel</SelectItem>
        </SelectContent>
      </Select>
      <Select value={view.status ?? ALL} onValueChange={pick('status')}>
        <SelectTrigger aria-label="Status" className="h-9 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All statuses</SelectItem>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
          <SelectItem value={NONE}>No status</SelectItem>
        </SelectContent>
      </Select>
      {isFiltered(view) ? (
        <Button variant="ghost" className="h-9 px-3" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
