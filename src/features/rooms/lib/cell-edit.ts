import type { GuestValues } from '../api/rooms.schema';
import { ROOM_GUEST_STATUSES, type RoomGuestStatus } from '../api/rooms.schema';
import { columnOf, type ColumnKey } from './columns';

// A typed cell → the field to save. Inputs already hold the right shape for dates (a date input),
// hotels and statuses (selects); text is trimmed and counts are checked here.

export type CellChange =
  { ok: true; change: Partial<GuestValues> } | { ok: false; message: string };

export function cellChange(key: ColumnKey, input: string): CellChange {
  const text = input.trim();
  const column = columnOf(key);
  switch (column.kind) {
    case 'hotel':
      return { ok: true, change: { eventHotelId: text === '' ? null : text } };
    case 'status':
      return {
        ok: true,
        change: {
          status: (ROOM_GUEST_STATUSES as readonly string[]).includes(text)
            ? (text as RoomGuestStatus)
            : null,
        },
      };
    case 'count': {
      if (text === '') return { ok: true, change: { [key]: null } };
      if (!/^\d{1,5}$/.test(text))
        return { ok: false, message: `${column.title} takes a whole number` };
      return { ok: true, change: { [key]: Number(text) } };
    }
    case 'date':
      return { ok: true, change: { [key]: text === '' ? null : text } };
    case 'text':
      if (key === 'name' && text === '') return { ok: false, message: 'Name is required' };
      return { ok: true, change: { [key]: text === '' ? null : text } };
  }
}

/** What an input shows for a row's field. */
export function cellValue(row: GuestValues, key: ColumnKey): string {
  if (key === 'hotel') return row.eventHotelId ?? '';
  const value = row[key];
  return value === null ? '' : String(value);
}
