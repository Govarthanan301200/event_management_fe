import { describe, expect, it } from 'vitest';
import { envelopeStatus, isShared, lineTotal, sumOfLines } from './rollup';

const rows = (...budgets: (number | null)[]) => budgets.map((budget) => ({ budget }));

describe('lineTotal (spec §12)', () => {
  it('sums row budgets when any row has one', () => {
    expect(lineTotal({ lineBudget: null, rows: rows(75_000, null, 2_00_000) })).toBe(2_75_000);
  });
  it('uses the line budget when no row has one, else 0', () => {
    expect(lineTotal({ lineBudget: 1_80_000, rows: rows(null, null) })).toBe(1_80_000);
    expect(lineTotal({ lineBudget: null, rows: rows(null) })).toBe(0);
  });
});

describe('isShared', () => {
  it('is Shared only for a line budget across several functions (or none left)', () => {
    expect(isShared({ lineBudget: 1_80_000, rows: rows(null, null, null) })).toBe(true);
    expect(isShared({ lineBudget: 60_000, rows: rows(null) })).toBe(false);
    expect(isShared({ lineBudget: 60_000, rows: [] })).toBe(true);
    expect(isShared({ lineBudget: null, rows: rows(10, 20) })).toBe(false);
  });
});

describe('sumOfLines', () => {
  it('adds line totals', () => {
    expect(
      sumOfLines([
        { lineBudget: null, rows: rows(75_000, 2_00_000) },
        { lineBudget: 1_80_000, rows: rows(null, null) },
      ]),
    ).toBe(4_55_000);
  });
});

describe('envelopeStatus', () => {
  it('reports left, over, or no envelope', () => {
    expect(envelopeStatus(null, 100)).toEqual({ kind: 'none' });
    expect(envelopeStatus(12_00_000, 11_10_000)).toEqual({
      kind: 'left',
      amount: 90_000,
      share: 0.925,
    });
    expect(envelopeStatus(7_00_000, 7_50_000)).toEqual({ kind: 'over', amount: 50_000 });
    expect(envelopeStatus(0, 0)).toEqual({ kind: 'left', amount: 0, share: 1 });
  });
});
