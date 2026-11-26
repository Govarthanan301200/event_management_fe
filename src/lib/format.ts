const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** ₹1,80,000 — full figure, for tables, drawers and totals. */
export function formatINR(amount: number): string {
  return inr.format(amount);
}

const grouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** 12,00,000 — a full figure without the ₹, for tables captioned "Amounts in ₹". */
export function formatGrouped(amount: number): string {
  return grouped.format(amount);
}

/** ₹18.2L / ₹1.2Cr — compact form, only for dashboard rows and mobile cards. */
export function formatINRCompact(amount: number): string {
  if (Math.abs(amount) >= 1_00_00_000) return `₹${trim(amount / 1_00_00_000)}Cr`;
  if (Math.abs(amount) >= 1_00_000) return `₹${trim(amount / 1_00_000)}L`;
  return formatINR(amount);
}

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

/** "14 Feb" in the current year, otherwise "14 Feb 2027". */
export function formatDate(date: Date, timeZone = 'Asia/Kolkata'): string {
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone,
  }).format(date);
}

/** "2 Feb, 6:10 pm": date as formatDate, then 12-hour time (company default, §17). */
export function formatDateTime(date: Date, timeZone = 'Asia/Kolkata'): string {
  const time = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(date);
  return `${formatDate(date, timeZone)}, ${time}`;
}

/** Monogram letters: "Shubh Aarambh Events" → "SA"; "Utsav" → "UT". */
export function initials(name: string): string {
  const [first = '', second] = name.trim().split(/\s+/);
  const letters =
    second === undefined ? first.slice(0, 2) : `${first.charAt(0)}${second.charAt(0)}`;
  return letters.toUpperCase();
}

/** "8,000" or "25,00,000" → whole rupees; empty → null. Callers validate the shape first. */
export function parseRupees(text: string): number | null {
  const digits = text.replace(/,/g, '').trim();
  return digits === '' ? null : Number(digits);
}

const dayMonth = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const dayMonthYear = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** A calendar date "YYYY-MM-DD" (company-local, no zone) as a UTC instant, for formatting only. */
function calendarDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function currentYear(timeZone: string): number {
  return Number(new Intl.DateTimeFormat('en-IN', { year: 'numeric', timeZone }).format(new Date()));
}

/** Function dates: "12 Feb" in the current year, otherwise "12 Feb 2027". */
export function formatDay(isoDate: string, timeZone = 'Asia/Kolkata'): string {
  const date = calendarDate(isoDate);
  return date.getUTCFullYear() === currentYear(timeZone)
    ? dayMonth.format(date)
    : dayMonthYear.format(date);
}

/**
 * An event's span: "12 Feb 2027", "12–14 Feb 2027", "28 Feb – 2 Mar 2027" or
 * "30 Dec 2026 – 2 Jan 2027". The year is dropped when both ends are in the current year.
 */
export function formatDateRange(first: string, last: string, timeZone = 'Asia/Kolkata'): string {
  if (first === last) return formatDay(first, timeZone);
  const [from, to] = [calendarDate(first), calendarDate(last)];
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const year =
    sameYear && from.getUTCFullYear() === currentYear(timeZone) ? '' : ` ${to.getUTCFullYear()}`;
  if (!sameYear) return `${dayMonthYear.format(from)} – ${dayMonthYear.format(to)}`;
  if (from.getUTCMonth() === to.getUTCMonth()) {
    const month = new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' }).format(to);
    return `${from.getUTCDate()}–${to.getUTCDate()} ${month}${year}`;
  }
  return `${dayMonth.format(from)} – ${dayMonth.format(to)}${year}`;
}

/** Wall-clock "18:30" → "6:30 PM" (12-hour company default, decision 2026-11-25). */
export function formatClock(hhmm: string): string {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number);
  const suffix = hours < 12 ? 'AM' : 'PM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** Whether an end time before the start means the function runs past midnight. */
export function endsNextDay(start: string, end: string | null): boolean {
  return end !== null && end < start;
}

/** "6:30 PM – 11:00 PM"; "6:30 PM – 1:00 AM +1" past midnight; "6:30 PM" with no end. */
export function formatTimeRange(start: string, end: string | null): string {
  if (end === null) return formatClock(start);
  return `${formatClock(start)} – ${formatClock(end)}${endsNextDay(start, end) ? ' +1' : ''}`;
}
