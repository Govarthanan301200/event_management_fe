import type { GuestRow, Hotel, RoomGuestStatus } from '../api/rooms.schema';
import { ROOM_GUEST_STATUSES } from '../api/rooms.schema';
import { COLUMNS, type ColumnKey } from './columns';
import { STATUS_LABELS } from './status';

// S14 filter and sort (spec §10 "Sort and filter by any column; quick filters for hotel and
// status"). A view only: the stored order is the order rows were added. Kept in the URL.

/** Rows with no hotel or no status have their own filter choice. */
export const NONE = 'none';

export type SortDir = 'asc' | 'desc';
export type RoomsView = {
  q: string;
  hotel: string | null;
  status: RoomGuestStatus | typeof NONE | null;
  sort: ColumnKey | null;
  dir: SortDir;
};

const columnKeys = new Set<string>(COLUMNS.map((column) => column.key));
const statuses = new Set<string>([...ROOM_GUEST_STATUSES, NONE]);

export function readView(params: URLSearchParams): RoomsView {
  const sort = params.get('sort');
  const status = params.get('status');
  return {
    q: params.get('q') ?? '',
    hotel: params.get('hotel'),
    status: status !== null && statuses.has(status) ? (status as RoomsView['status']) : null,
    sort: sort !== null && columnKeys.has(sort) ? (sort as ColumnKey) : null,
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

export function isFiltered(view: RoomsView): boolean {
  return view.q.trim() !== '' || view.hotel !== null || view.status !== null;
}

/** What a cell reads as, for filtering and sorting (hotel and status by their names). */
export function cellText(
  row: GuestRow,
  key: ColumnKey,
  hotels: ReadonlyMap<string, string>,
): string {
  if (key === 'hotel') return row.eventHotelId ? (hotels.get(row.eventHotelId) ?? '') : '';
  if (key === 'status') return row.status ? STATUS_LABELS[row.status] : '';
  const value = row[key];
  return value === null ? '' : String(value);
}

const collator = new Intl.Collator('en-IN', { numeric: true, sensitivity: 'base' });

function compare(a: GuestRow, b: GuestRow, key: ColumnKey, hotels: ReadonlyMap<string, string>) {
  if (key === 'pax' || key === 'rc' || key === 'hamper') return (a[key] ?? 0) - (b[key] ?? 0);
  return collator.compare(cellText(a, key, hotels), cellText(b, key, hotels));
}

const blank = (row: GuestRow, key: ColumnKey, hotels: ReadonlyMap<string, string>) =>
  cellText(row, key, hotels) === '';

/**
 * Filters by the quick filters and by text in any column, then sorts by one column. Blank cells
 * sort last either way; ties keep the stored order. "G10" sorts after "G9".
 */
export function applyView(
  rows: readonly GuestRow[],
  hotels: readonly Hotel[],
  view: RoomsView,
): GuestRow[] {
  const names = new Map(hotels.map((hotel) => [hotel.id, hotel.name]));
  const needle = view.q.trim().toLowerCase();
  const shown = rows.filter((row) => {
    if (view.hotel !== null && (row.eventHotelId ?? NONE) !== view.hotel) return false;
    if (view.status !== null && (row.status ?? NONE) !== view.status) return false;
    if (needle === '') return true;
    return COLUMNS.some((column) =>
      cellText(row, column.key, names).toLowerCase().includes(needle),
    );
  });
  const { sort } = view;
  if (sort === null) return shown;
  const sign = view.dir === 'asc' ? 1 : -1;
  return shown
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const aBlank = blank(a.row, sort, names);
      const bBlank = blank(b.row, sort, names);
      if (aBlank !== bBlank) return aBlank ? 1 : -1;
      return sign * compare(a.row, b.row, sort, names) || a.index - b.index;
    })
    .map(({ row }) => row);
}

/** Header click: ascending, then descending, then back to the stored order. */
export function nextSort(view: RoomsView, key: ColumnKey): Pick<RoomsView, 'sort' | 'dir'> {
  if (view.sort !== key) return { sort: key, dir: 'asc' };
  if (view.dir === 'asc') return { sort: key, dir: 'desc' };
  return { sort: null, dir: 'asc' };
}
