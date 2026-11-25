import { describe, expect, it } from 'vitest';
import {
  formatClock,
  formatDateRange,
  formatDateTime,
  formatDay,
  formatINR,
  formatINRCompact,
  formatTimeRange,
  initials,
  parseRupees,
} from './format';

describe('formatINR', () => {
  it('uses en-IN grouping', () => {
    expect(formatINR(180000)).toBe('₹1,80,000');
  });

  it('handles zero', () => {
    expect(formatINR(0)).toBe('₹0');
  });
});

describe('formatINRCompact', () => {
  it('shows lakhs and crores', () => {
    expect(formatINRCompact(1_820_000)).toBe('₹18.2L');
    expect(formatINRCompact(12_000_000)).toBe('₹1.2Cr');
  });

  it('falls back to the full figure below a lakh', () => {
    expect(formatINRCompact(99_999)).toBe('₹99,999');
  });
});

describe('formatDateTime', () => {
  it('shows the date and a 12-hour time in India time', () => {
    // 12:40 UTC is 6:10 PM in Asia/Kolkata.
    const value = formatDateTime(new Date('2027-02-02T12:40:00Z'));
    expect(value).toMatch(/^2 Feb 2027, 6:10\s?pm$/i);
  });
});

describe('initials', () => {
  it('takes the first letters of the first two words, or two letters of one word', () => {
    expect(initials('Shubh Aarambh Events')).toBe('SA');
    expect(initials('utsav')).toBe('UT');
    expect(initials('  ')).toBe('');
  });
});

describe('function dates and times', () => {
  const thisYear = new Date().getFullYear();

  it('formats a calendar date without shifting it across time zones', () => {
    expect(formatDay('2099-02-12')).toBe('12 Feb 2099');
    expect(formatDay(`${thisYear}-02-12`)).toBe('12 Feb');
  });

  it('formats date ranges compactly', () => {
    expect(formatDateRange('2099-02-12', '2099-02-12')).toBe('12 Feb 2099');
    expect(formatDateRange('2099-02-12', '2099-02-14')).toBe('12–14 Feb 2099');
    expect(formatDateRange('2099-02-28', '2099-03-02')).toBe('28 Feb – 2 Mar 2099');
    expect(formatDateRange('2098-12-30', '2099-01-02')).toBe('30 Dec 2098 – 2 Jan 2099');
    expect(formatDateRange(`${thisYear}-02-12`, `${thisYear}-02-14`)).toBe('12–14 Feb');
  });

  it('shows 12-hour times', () => {
    expect(formatClock('00:05')).toBe('12:05 AM');
    expect(formatClock('06:00')).toBe('6:00 AM');
    expect(formatClock('12:00')).toBe('12:00 PM');
    expect(formatClock('18:30')).toBe('6:30 PM');
  });

  it('marks functions that run past midnight', () => {
    expect(formatTimeRange('11:00', '15:00')).toBe('11:00 AM – 3:00 PM');
    expect(formatTimeRange('18:30', '01:00')).toBe('6:30 PM – 1:00 AM +1');
    expect(formatTimeRange('18:30', null)).toBe('6:30 PM');
  });

  it('parses rupees typed with Indian grouping', () => {
    expect(parseRupees('25,00,000')).toBe(2_500_000);
    expect(parseRupees('  ')).toBeNull();
  });
});
