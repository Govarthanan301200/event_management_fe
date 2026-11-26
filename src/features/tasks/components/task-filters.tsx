import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EventFunction } from '@/features/events';
import { hasFilters, NO_FUNCTION, type TaskFilters } from '../lib/task-groups';

const ALL = 'all';

type TaskFiltersBarProps = {
  filters: TaskFilters;
  functions: readonly EventFunction[];
  vendors: readonly { id: string; name: string }[];
  onChange: (key: keyof TaskFilters, value: string | null) => void;
  onClear: () => void;
};

/** S11 filters for status, function and vendor (spec §13), in one row above the list. */
export function TaskFiltersBar({
  filters,
  functions,
  vendors,
  onChange,
  onClear,
}: TaskFiltersBarProps) {
  const pick = (key: keyof TaskFilters) => (value: string) => {
    onChange(key, value === ALL ? null : value);
  };
  return (
    <div role="group" aria-label="Filter tasks" className="flex flex-wrap items-center gap-2">
      <Select value={filters.status ?? ALL} onValueChange={pick('status')}>
        <SelectTrigger aria-label="Status" className="h-9 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="done">Done</SelectItem>
          <SelectItem value="issue">Issue</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.fn ?? ALL} onValueChange={pick('fn')}>
        <SelectTrigger aria-label="Function" className="h-9 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All functions</SelectItem>
          {functions.map((fn) => (
            <SelectItem key={fn.id} value={fn.id}>
              {fn.name}
            </SelectItem>
          ))}
          <SelectItem value={NO_FUNCTION}>No function</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.vendor ?? ALL}
        onValueChange={pick('vendor')}
        disabled={vendors.length === 0}
      >
        <SelectTrigger aria-label="Vendor" className="h-9 w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL}>All vendors</SelectItem>
          {vendors.map((vendor) => (
            <SelectItem key={vendor.id} value={vendor.id}>
              {vendor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters(filters) ? (
        <Button variant="ghost" className="h-9 px-3" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
