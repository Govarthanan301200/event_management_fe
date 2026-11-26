import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Hotel } from '../api/rooms.schema';
import { COLUMNS, type ColumnKey } from '../lib/columns';
import type { RoomsView } from '../lib/view';

/** Minimum widths so a sheet stays readable when it scrolls sideways. */
const WIDTH: Record<ColumnKey, string> = {
  gId: 'min-w-20',
  srNo: 'min-w-16',
  cluster: 'min-w-20',
  groupId: 'min-w-16',
  name: 'min-w-48',
  contact: 'min-w-36',
  hotel: 'min-w-36',
  roomNo: 'min-w-20',
  status: 'min-w-32',
  pax: 'min-w-16',
  rc: 'min-w-14',
  hamper: 'min-w-20',
  checkInDate: 'min-w-36',
  arrivalTime: 'min-w-36',
  departureDate: 'min-w-36',
};

type GuestGridProps = {
  view: RoomsView;
  onSort: (key: ColumnKey) => void;
  /** Ids of the rows shown, for "select all". */
  shownIds: readonly string[];
  selected: ReadonlySet<string>;
  onSelectAll: (select: boolean) => void;
  hotels: readonly Hotel[];
  children: ReactNode;
};

/**
 * S14 spreadsheet surface (design system): dense rows, `label` headers on the sunken surface,
 * no vertical rules or zebra, the selected row `gold-soft`, the active cell a 2px gold outline.
 * The select and G ID columns stay put when the sheet scrolls sideways.
 */
export function GuestGrid({
  view,
  onSort,
  shownIds,
  selected,
  onSelectAll,
  children,
}: GuestGridProps) {
  const all = shownIds.length > 0 && shownIds.every((id) => selected.has(id));
  const some = !all && shownIds.some((id) => selected.has(id));
  return (
    // A capped height keeps the header row in view: sticky headers don't stick inside a sideways
    // scroller unless the scroller also scrolls vertically.
    <div
      data-rooms-grid
      className="max-h-[70dvh] overflow-auto rounded-md border border-border bg-card"
    >
      <table className="w-max min-w-full border-separate border-spacing-0 text-body">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 w-10 border-b border-border bg-muted px-3">
              <Checkbox
                aria-label="Select all rows shown"
                checked={all ? true : some ? 'indeterminate' : false}
                disabled={shownIds.length === 0}
                onCheckedChange={(checked) => {
                  onSelectAll(checked === true);
                }}
              />
            </th>
            {COLUMNS.map((column, index) => {
              const sorted = view.sort === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={sorted ? (view.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'sticky top-0 z-20 border-b border-border bg-muted p-0 text-left text-label font-medium text-muted-foreground',
                    WIDTH[column.key],
                    index === 0 && 'left-10 z-30',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSort(column.key);
                    }}
                    className={cn(
                      'flex h-10 w-full items-center gap-1 px-2 hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      column.kind === 'count' && 'justify-end',
                      sorted && 'text-foreground',
                    )}
                  >
                    {column.title}
                    {sorted && view.dir === 'asc' ? (
                      <ArrowUp className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                    ) : null}
                    {sorted && view.dir === 'desc' ? (
                      <ArrowDown className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                    ) : null}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
