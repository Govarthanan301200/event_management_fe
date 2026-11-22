import { describe, expect, it } from 'vitest';
import { formatINR, formatINRCompact } from './format';

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
