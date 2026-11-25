import { describe, expect, it } from 'vitest';
import { formatQuantity, summariseQuantities } from './quantities';

describe('formatQuantity', () => {
  it('shows each parameter with its unit', () => {
    expect(formatQuantity('pax', { pax: 1200 })).toBe('1,200 pax');
    expect(formatQuantity('hours', { hours: 1 })).toBe('1 hr');
    expect(formatQuantity('hours', { hours: 4.5 })).toBe('4.5 hrs');
    expect(formatQuantity('minutes', { minutes: 10 })).toBe('10 min');
    expect(
      formatQuantity('size', {
        size: [
          { label: 'Stage', lengthFt: 40, widthFt: 20 },
          { label: 'Hall', lengthFt: 120, widthFt: 80 },
        ],
      }),
    ).toBe('Stage 40 × 20 ft, Hall 120 × 80 ft');
    expect(formatQuantity('work', { work: 'Website with RSVP page' })).toBe(
      'Website with RSVP page',
    );
    expect(formatQuantity('pax', {})).toBeNull();
  });

  it('summarises a row without summing across parameters', () => {
    expect(summariseQuantities(['pax', 'hours'], { pax: 400, hours: 5 })).toBe('400 pax · 5 hrs');
    expect(summariseQuantities(['pax', 'hours'], {})).toBe('');
  });
});
