import { describe, expect, it } from 'vitest';
import { describeSuggestion, formatRate, rateSuggestion } from './rate-suggestion';

const normalise = (text: string) => text.replace(/\s/g, ' ');

describe('rateSuggestion (spec §9)', () => {
  it('is null without a rate: a vendor with no rate is fully usable, nothing is suggested', () => {
    expect(rateSuggestion(null, [{ hours: 5 }])).toBeNull();
    expect(rateSuggestion(undefined, [{ hours: 5 }])).toBeNull();
  });

  it('multiplies the rate by the quantity summed over the line’s rows (S8 wireframe: 9 hrs × ₹8,000)', () => {
    const suggestion = rateSuggestion({ amount: 8000, basis: 'hours' }, [
      { hours: 5 },
      { hours: 4 },
    ]);
    expect(suggestion).toEqual({
      amount: 72_000,
      quantity: 9,
      rate: { amount: 8000, basis: 'hours' },
    });
    expect(suggestion && normalise(describeSuggestion(suggestion))).toBe('9 hrs × ₹8,000');
  });

  it('uses only the rate’s own parameter', () => {
    expect(
      rateSuggestion({ amount: 450, basis: 'pax' }, [{ pax: 400, hours: 5 }, { pax: 150 }])?.amount,
    ).toBe(247_500);
    expect(
      rateSuggestion({ amount: 2000, basis: 'minutes' }, [{ minutes: 10, hours: 2 }])?.amount,
    ).toBe(20_000);
  });

  it('suggests the package amount whatever the quantities', () => {
    const suggestion = rateSuggestion({ amount: 25_000, basis: 'package' }, [{ hours: 3 }, {}]);
    expect(suggestion).toMatchObject({ amount: 25_000, quantity: 1 });
    expect(suggestion && normalise(describeSuggestion(suggestion))).toBe('Package ₹25,000');
  });

  it('a package still suggests its amount with no rows', () => {
    expect(rateSuggestion({ amount: 25_000, basis: 'package' }, [])?.amount).toBe(25_000);
  });

  it('prices size per sq ft of total area across measurements and rows', () => {
    const rows = [
      {
        size: [
          { label: 'Stage', lengthFt: 40, widthFt: 20 },
          { label: 'Hall', lengthFt: 10, widthFt: 10 },
        ],
      },
      { size: [{ label: 'Stage', lengthFt: 30, widthFt: 20 }] },
    ];
    expect(rateSuggestion({ amount: 50, basis: 'size' }, rows)).toMatchObject({
      amount: 75_000,
      quantity: 1500,
    });
  });

  it('skips half-filled size measurements', () => {
    const rows = [{ size: [{ label: 'Stage', lengthFt: 40, widthFt: null }] }];
    expect(rateSuggestion({ amount: 50, basis: 'size' }, rows)).toBeNull();
  });

  it('is null when there is no quantity to multiply', () => {
    expect(rateSuggestion({ amount: 8000, basis: 'hours' }, [])).toBeNull();
    expect(
      rateSuggestion({ amount: 8000, basis: 'hours' }, [{ hours: null }, { pax: 100 }]),
    ).toBeNull();
    expect(rateSuggestion({ amount: 8000, basis: 'hours' }, [{ hours: 0 }])).toBeNull();
  });

  it('ignores negative or non-finite quantities', () => {
    expect(
      rateSuggestion({ amount: 100, basis: 'pax' }, [{ pax: -5 }, { pax: Number.NaN }, { pax: 10 }])
        ?.amount,
    ).toBe(1000);
  });

  it('rounds half hours to whole rupees', () => {
    expect(rateSuggestion({ amount: 1999, basis: 'hours' }, [{ hours: 2.5 }])?.amount).toBe(4998);
  });

  it('a zero rate suggests ₹0 (a free service is still a rate)', () => {
    expect(rateSuggestion({ amount: 0, basis: 'pax' }, [{ pax: 100 }])?.amount).toBe(0);
  });
});

describe('formatRate', () => {
  it('reads as amount and basis', () => {
    expect(normalise(formatRate(8000, 'hours'))).toBe('₹8,000 per hour');
    expect(normalise(formatRate(25_000, 'package'))).toBe('₹25,000 package');
    expect(normalise(formatRate(50, 'size'))).toBe('₹50 per sq ft');
  });
});
