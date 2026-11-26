import { describe, expect, it } from 'vitest';
import type { EventMoneySummary } from '@/features/summary';
import { categoryCards, selectionFrom } from './summary-view';

const category = (
  id: string,
  byFunction: Record<string, number>,
  shared: number,
  envelope: number | null,
) => {
  const planned = shared + Object.values(byFunction).reduce((a, b) => a + b, 0);
  const left = envelope === null ? null : envelope - planned;
  return { id, name: id, byFunction, shared, planned, envelope, left, over: (left ?? 0) < 0 };
};

const summary: EventMoneySummary = {
  overallBudget: 25_00_000,
  planned: 10_95_000,
  left: 14_05_000,
  over: false,
  services: 4,
  categoriesOver: 1,
  categoriesWithEnvelope: 2,
  functions: [
    {
      id: 'mehendi',
      name: 'Mehendi',
      date: '2027-02-12',
      startTime: '11:00',
      guestCount: 150,
      total: 1_25_000,
    },
    {
      id: 'sangeet',
      name: 'Sangeet',
      date: '2027-02-13',
      startTime: '18:30',
      guestCount: 400,
      total: 7_50_000,
    },
  ],
  shared: 2_20_000,
  categories: [
    category('catering', { mehendi: 75_000, sangeet: 2_00_000 }, 0, 12_00_000),
    category('decor', { mehendi: 50_000, sangeet: 5_50_000 }, 0, 5_00_000),
    category('photo', {}, 1_80_000, null),
    category('transport', { sangeet: 0 }, 40_000, null),
  ],
  envelopeTotal: 17_00_000,
  lines: [],
};

describe('categoryCards (S10 below 1024px)', () => {
  it('All: every category with its planned figure, envelope and left', () => {
    const view = categoryCards(summary, { kind: 'all' });
    expect(view.total).toBe(10_95_000);
    expect(view.cards.map((c) => [c.id, c.amount, c.envelope, c.left])).toEqual([
      ['catering', 2_75_000, 12_00_000, 9_25_000],
      ['decor', 6_00_000, 5_00_000, -1_00_000],
      ['photo', 1_80_000, null, null],
      ['transport', 40_000, null, null],
    ]);
  });

  it('a function: only categories with something attributed to it (₹0 counts), no envelopes', () => {
    const view = categoryCards(summary, { kind: 'function', id: 'sangeet' });
    expect(view.total).toBe(7_50_000);
    expect(view.cards.map((c) => [c.id, c.amount, c.envelope])).toEqual([
      ['catering', 2_00_000, null],
      ['decor', 5_50_000, null],
      ['transport', 0, null],
    ]);
  });

  it('Shared: only categories with a Shared amount', () => {
    const view = categoryCards(summary, { kind: 'shared' });
    expect(view.total).toBe(2_20_000);
    expect(view.cards.map((c) => [c.id, c.amount])).toEqual([
      ['photo', 1_80_000],
      ['transport', 40_000],
    ]);
  });

  it('an unknown function shows nothing', () => {
    expect(categoryCards(summary, { kind: 'function', id: 'gone' })).toEqual({
      cards: [],
      total: 0,
    });
  });
});

describe('selectionFrom', () => {
  it('reads chip ids', () => {
    expect(selectionFrom('all')).toEqual({ kind: 'all' });
    expect(selectionFrom('shared')).toEqual({ kind: 'shared' });
    expect(selectionFrom('mehendi')).toEqual({ kind: 'function', id: 'mehendi' });
  });
});
