import { formatClock } from '@/lib/format';

// Reading spreadsheet cells (paste and XLSX import). Each parser returns the value, null for a
// blank cell, or undefined when the cell can't be read (the import preview counts those).

export type Cell = string | number | boolean | Date | null | undefined;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function isoDate(year: number, month: number, day: number): string | undefined {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return undefined;
  return date.toISOString().slice(0, 10);
}

const fullYear = (year: number) => (year < 100 ? 2000 + year : year);

/** Excel's day 0 is 30 Dec 1899 (its 1900 leap-year quirk included). */
function fromExcelSerial(serial: number): string | undefined {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2_958_465) return undefined;
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * A calendar date: an Excel date cell (a UTC midnight Date), an Excel serial number, or text in
 * ISO ("2027-02-08"), Indian day-first ("8/2/2027", "08-02-27") or "8 Feb 2027" / "8-Feb-27" form.
 * A day and month without a year can't be placed, so it is unreadable.
 */
export function parseDate(cell: Cell): string | null | undefined {
  if (cell === null || cell === undefined) return null;
  if (cell instanceof Date) {
    return Number.isNaN(cell.getTime()) ? undefined : cell.toISOString().slice(0, 10);
  }
  if (typeof cell === 'number') return fromExcelSerial(cell);
  if (typeof cell === 'boolean') return undefined;
  const text = cell.trim();
  if (text === '') return null;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (match) return isoDate(Number(match[1]), Number(match[2]), Number(match[3]));
  match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(text);
  if (match) return isoDate(fullYear(Number(match[3])), Number(match[2]), Number(match[1]));
  match = /^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3})[a-z]*[\s,-]+(\d{2}|\d{4})$/i.exec(text);
  if (match) {
    const month = MONTHS.indexOf((match[2] ?? '').toLowerCase()) + 1;
    return month === 0 ? undefined : isoDate(fullYear(Number(match[3])), month, Number(match[1]));
  }
  return undefined;
}

/** PAX, RC and Hamper: whole numbers from 0 to 99,999 ("1,200" reads as 1200). */
export function parseCount(cell: Cell): number | null | undefined {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === 'number')
    return Number.isInteger(cell) && cell >= 0 && cell <= 99_999 ? cell : undefined;
  if (typeof cell !== 'string') return undefined;
  const text = cell.trim().replace(/,/g, '');
  if (text === '') return null;
  return /^\d{1,5}$/.test(text) ? Number(text) : undefined;
}

/**
 * Free text. Numbers keep their digits ("206"); an Excel time cell reads as "8:30 PM"; a date
 * cell as "2027-02-08". Over `max` characters it is cut to fit (`shortened`).
 */
export function parseText(cell: Cell, max: number): { value: string | null; shortened: boolean } {
  if (cell === null || cell === undefined) return { value: null, shortened: false };
  let text: string;
  if (cell instanceof Date) {
    // Excel stores a time of day as a date on 30 Dec 1899.
    text =
      cell.getUTCFullYear() < 1900
        ? formatClock(cell.toISOString().slice(11, 16))
        : cell.toISOString().slice(0, 10);
  } else {
    text = String(cell).trim();
  }
  if (text === '') return { value: null, shortened: false };
  return text.length > max
    ? { value: text.slice(0, max), shortened: true }
    : { value: text, shortened: false };
}
