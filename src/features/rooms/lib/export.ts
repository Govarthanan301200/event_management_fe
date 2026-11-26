import type { GuestRow, Hotel } from '../api/rooms.schema';
import { COLUMNS } from './columns';
import { STATUS_LABELS } from './status';

// XLSX export (spec §10: "export doubles as the rooming list sent to hotels"). Pure: builds the
// cells; `write-excel-file` (loaded on demand) writes them. Dates are real Excel dates and counts
// real numbers, so the file sorts and sums in Excel, and imports back unchanged.

export type ExportCell =
  | { value: string; type: StringConstructor; fontWeight?: 'bold' }
  | { value: number; type: NumberConstructor }
  | { value: Date; type: DateConstructor; format: string }
  | null;

export const DATE_FORMAT = 'dd mmm yyyy';

function cellFor(
  row: GuestRow,
  key: (typeof COLUMNS)[number]['key'],
  hotels: ReadonlyMap<string, string>,
): ExportCell {
  switch (key) {
    case 'hotel': {
      const name = row.eventHotelId ? hotels.get(row.eventHotelId) : undefined;
      return name ? { value: name, type: String } : null;
    }
    case 'status':
      return row.status ? { value: STATUS_LABELS[row.status], type: String } : null;
    case 'pax':
    case 'rc':
    case 'hamper': {
      const value = row[key];
      return value === null ? null : { value, type: Number };
    }
    case 'checkInDate':
    case 'departureDate': {
      const value = row[key];
      return value === null
        ? null
        : { value: new Date(`${value}T00:00:00Z`), type: Date, format: DATE_FORMAT };
    }
    default: {
      const value = row[key];
      return value === null ? null : { value, type: String };
    }
  }
}

/** A bold header row with the table's titles, then one row per guest row, in the order given. */
export function exportSheet(rows: readonly GuestRow[], hotels: readonly Hotel[]): ExportCell[][] {
  const hotelNames = new Map(hotels.map((hotel) => [hotel.id, hotel.name]));
  return [
    COLUMNS.map((column) => ({ value: column.title, type: String, fontWeight: 'bold' as const })),
    ...rows.map((row) => COLUMNS.map((column) => cellFor(row, column.key, hotelNames))),
  ];
}

/** "Ananya & Rohan · Hotel A rooming list.xlsx"; characters Windows refuses become spaces. */
export function exportFileName(eventName: string, hotelName?: string): string {
  const base = [eventName, hotelName].filter(Boolean).join(' · ');
  return `${base} rooming list.xlsx`
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Column widths in characters, wide enough for the titles and typical values. */
export const EXPORT_WIDTHS = [8, 7, 9, 7, 24, 16, 18, 9, 11, 6, 5, 8, 13, 16, 14];
