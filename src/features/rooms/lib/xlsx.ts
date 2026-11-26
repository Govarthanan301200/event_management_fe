import type { GuestRow, Hotel } from '../api/rooms.schema';
import type { Cell } from './cells';
import { DATE_FORMAT, EXPORT_WIDTHS, exportSheet } from './export';

// The two XLSX libraries load only when Import or Export is used, so the app stays light.

/** The first sheet's cells (dates as Date, numbers as numbers). */
export async function readXlsx(file: File): Promise<Cell[][]> {
  const { readSheet } = await import('read-excel-file/browser');
  return readSheet(file);
}

/** Writes the rows as shown, with a bold, frozen header row. */
export async function writeXlsx(
  rows: readonly GuestRow[],
  hotels: readonly Hotel[],
  fileName: string,
): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  await writeXlsxFile(exportSheet(rows, hotels), {
    sheet: 'Rooms and guests',
    columns: EXPORT_WIDTHS.map((width) => ({ width })),
    stickyRowsCount: 1,
    dateFormat: DATE_FORMAT,
  }).toFile(fileName);
}
