import type { Hotel, ImportRowInput } from '../api/rooms.schema';
import { parseCount, parseDate, parseText, type Cell } from './cells';
import { COLUMNS, columnForHeader, type Column, type ColumnKey } from './columns';
import { parseStatus } from './status';

// Paste and XLSX import (spec §10; decisions 2026-11-27): sheet cells → rows to add. A first row
// that names the columns is a header: its columns map by title. Without one, columns map in
// table order from G ID ("columns map in order").

export type Unreadable = { column: string; count: number };

export type SheetPlan = {
  rows: ImportRowInput[];
  /** Rows with data but no name (the one required column): left out. */
  skippedNoName: number;
  /** Cells that couldn't be read, per column: kept blank. */
  unreadable: Unreadable[];
  /** Text cut to the column's length. */
  shortened: number;
  headerSkipped: boolean;
  /** Hotel names not on this event's list, which the import adds. */
  newHotels: string[];
};

/** A header row names at least two columns. */
function headerColumns(first: readonly Cell[]): (Column | undefined)[] | null {
  const columns = first.map((cell) =>
    typeof cell === 'string' ? columnForHeader(cell) : undefined,
  );
  return columns.filter(Boolean).length >= 2 ? columns : null;
}

const isBlank = (cell: Cell) =>
  cell === null || cell === undefined || (typeof cell === 'string' && cell.trim() === '');

export function rowsFromSheet(
  data: readonly (readonly Cell[])[],
  hotels: readonly Hotel[],
): SheetPlan {
  const header = data[0] ? headerColumns(data[0]) : null;
  const columnsAt = header ?? COLUMNS;
  const body = header ? data.slice(1) : data;

  const unreadable = new Map<ColumnKey, number>();
  const miss = (key: ColumnKey) => {
    unreadable.set(key, (unreadable.get(key) ?? 0) + 1);
  };
  let shortened = 0;
  let skippedNoName = 0;
  const rows: ImportRowInput[] = [];

  for (const cells of body) {
    if (cells.every(isBlank)) continue;
    const row: Partial<ImportRowInput> = {};
    cells.forEach((cell, index) => {
      const column = columnsAt[index];
      if (!column || isBlank(cell)) return;
      switch (column.kind) {
        case 'text': {
          const text = parseText(cell, column.max ?? 120);
          if (text.shortened) shortened += 1;
          (row as Record<string, unknown>)[column.key] = text.value;
          break;
        }
        case 'hotel': {
          const text = parseText(cell, column.max ?? 120);
          if (text.shortened) shortened += 1;
          row.hotelName = text.value;
          break;
        }
        case 'count': {
          const value = parseCount(cell);
          if (value === undefined) miss(column.key);
          else (row as Record<string, unknown>)[column.key] = value;
          break;
        }
        case 'date': {
          const value = parseDate(cell);
          if (value === undefined) miss(column.key);
          else (row as Record<string, unknown>)[column.key] = value;
          break;
        }
        case 'status': {
          const value = parseStatus(String(cell));
          if (value === undefined) miss(column.key);
          else row.status = value;
          break;
        }
      }
    });
    if (!row.name) {
      skippedNoName += 1;
      continue;
    }
    rows.push({ ...row, name: row.name });
  }

  const known = new Set(hotels.map((hotel) => hotel.name.trim().toLowerCase()));
  const newHotels: string[] = [];
  for (const row of rows) {
    const name = row.hotelName?.trim();
    if (!name || known.has(name.toLowerCase())) continue;
    known.add(name.toLowerCase());
    newHotels.push(name);
  }

  return {
    rows,
    skippedNoName,
    unreadable: COLUMNS.flatMap((column) => {
      const count = unreadable.get(column.key);
      return count ? [{ column: column.title, count }] : [];
    }),
    shortened,
    headerSkipped: header !== null,
    newHotels,
  };
}

/**
 * Clipboard text from Excel or Google Sheets: tab-separated cells, one row per line, and cells
 * with tabs, quotes or line breaks wrapped in quotes ("" for a quote).
 */
export function parseClipboard(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source.charAt(i);
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === '') {
      quoted = true;
    } else if (char === '\t') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (source !== '') {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** A paste of more than one cell (a tab or a line break) becomes new rows; one value edits a cell. */
export function isBlockPaste(text: string): boolean {
  return /[\t\n]/.test(text.replace(/\r?\n$/, ''));
}
