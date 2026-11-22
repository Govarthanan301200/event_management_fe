const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** ₹1,80,000 — full figure, for tables, drawers and totals. */
export function formatINR(amount: number): string {
  return inr.format(amount);
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
