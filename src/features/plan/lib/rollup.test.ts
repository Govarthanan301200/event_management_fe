import { describe, expect, it } from 'vitest';
import { lineTotal } from './rollup';

// S8's live total only; every other roll-up is the server's (Backend summary/rollup.test.ts).
const rows = (...budgets: (number | null)[]) => budgets.map((budget) => ({ budget }));

describe('lineTotal (spec §12)', () => {
  it('sums row budgets when any row has one', () => {
    expect(lineTotal({ lineBudget: null, rows: rows(75_000, null, 2_00_000) })).toBe(2_75_000);
  });
  it('uses the line budget when no row has one, else 0', () => {
    expect(lineTotal({ lineBudget: 1_80_000, rows: rows(null, null) })).toBe(1_80_000);
    expect(lineTotal({ lineBudget: 1_80_000, rows: [] })).toBe(1_80_000);
    expect(lineTotal({ lineBudget: null, rows: rows(null) })).toBe(0);
  });
});
