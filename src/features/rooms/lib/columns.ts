import type { GuestValues } from '../api/rooms.schema';

// S14 columns (spec §10: "the planner's current sheet, kept as is, plus Hotel"), in sheet order.
// Paste and header-less imports map by this order; exports write it.

export type ColumnKind = 'text' | 'count' | 'date' | 'hotel' | 'status';

/** A row field; the Hotel column is `eventHotelId` on a row and a name in a sheet. */
export type ColumnKey = Exclude<keyof GuestValues, 'eventHotelId'> | 'hotel';

export type Column = {
  key: ColumnKey;
  title: string;
  kind: ColumnKind;
  /** Text length the server accepts. */
  max?: number;
  /** Other header spellings an imported sheet may use (compared without spaces or dots). */
  aliases?: readonly string[];
};

export const COLUMNS: readonly Column[] = [
  { key: 'gId', title: 'G ID', kind: 'text', max: 40, aliases: ['guestid', 'gid'] },
  { key: 'srNo', title: 'Sr No', kind: 'text', max: 40, aliases: ['srno', 'sno', 'serialno'] },
  { key: 'cluster', title: 'Cluster', kind: 'text', max: 40 },
  { key: 'groupId', title: 'ID', kind: 'text', max: 40, aliases: ['id'] },
  { key: 'name', title: 'Name', kind: 'text', max: 120, aliases: ['guestname', 'guest'] },
  { key: 'contact', title: 'Contact', kind: 'text', max: 60, aliases: ['phone', 'mobile'] },
  { key: 'hotel', title: 'Hotel', kind: 'hotel', max: 120 },
  { key: 'roomNo', title: 'Room No', kind: 'text', max: 40, aliases: ['room', 'roomno'] },
  { key: 'status', title: 'Status', kind: 'status' },
  { key: 'pax', title: 'PAX', kind: 'count' },
  { key: 'rc', title: 'RC', kind: 'count' },
  { key: 'hamper', title: 'Hamper', kind: 'count', aliases: ['hampers'] },
  {
    key: 'checkInDate',
    title: 'Check-in date',
    kind: 'date',
    aliases: ['checkin', 'checkindate'],
  },
  {
    key: 'arrivalTime',
    title: 'Arrival time',
    kind: 'text',
    max: 120,
    aliases: ['arrival', 'arrivaltime'],
  },
  {
    key: 'departureDate',
    title: 'Departure date',
    kind: 'date',
    aliases: ['departure', 'departuredate', 'checkout', 'checkoutdate'],
  },
];

export function columnOf(key: ColumnKey): Column {
  const column = COLUMNS.find((c) => c.key === key);
  if (!column) throw new Error(`Unknown column ${key}`);
  return column;
}

/** "Check-in date" → "checkindate": header matching ignores case, spaces and punctuation. */
export function headerKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** The column a header cell names, if any. */
export function columnForHeader(text: string): Column | undefined {
  const key = headerKey(text);
  if (key === '') return undefined;
  return COLUMNS.find(
    (column) => headerKey(column.title) === key || (column.aliases ?? []).includes(key),
  );
}
