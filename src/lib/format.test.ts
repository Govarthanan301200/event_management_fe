import { describe, expect, it } from 'vitest';
import { formatDateTime, formatINR, formatINRCompact, initials } from './format';

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
