import type { EventMoneySummary } from '@/features/summary';

/** The S10 card switcher (below 1024px): the whole event, one function, or the Shared column. */
export type SummarySelection =
  { kind: 'all' } | { kind: 'shared' } | { kind: 'function'; id: string };

export type CategoryCardView = {
  id: string;
  name: string;
  amount: number;
  /** Envelopes are per event, so only the "All" view measures against them. */
  envelope: number | null;
  left: number | null;
};

export type CardsView = { cards: CategoryCardView[]; total: number };

/**
 * The S10 grid read one column at a time (decision 2026-11-26: category cards plus a function
 * switcher below 1024px). Each card is a server figure; nothing is re-added except picking cells.
 */
export function categoryCards(summary: EventMoneySummary, selection: SummarySelection): CardsView {
  if (selection.kind === 'all') {
    return {
      cards: summary.categories.map((c) => ({
        id: c.id,
        name: c.name,
        amount: c.planned,
        envelope: c.envelope,
        left: c.left,
      })),
      total: summary.planned,
    };
  }
  if (selection.kind === 'shared') {
    return {
      cards: summary.categories
        .filter((c) => c.shared > 0)
        .map((c) => ({ id: c.id, name: c.name, amount: c.shared, envelope: null, left: null })),
      total: summary.shared,
    };
  }
  const fn = summary.functions.find((f) => f.id === selection.id);
  return {
    cards: summary.categories.flatMap((c) => {
      const amount = c.byFunction[selection.id];
      return amount === undefined
        ? []
        : [{ id: c.id, name: c.name, amount, envelope: null, left: null }];
    }),
    total: fn?.total ?? 0,
  };
}

/** Chip ids for the switcher: "all", "shared", or a function id. */
export function selectionFrom(id: string): SummarySelection {
  if (id === 'all') return { kind: 'all' };
  if (id === 'shared') return { kind: 'shared' };
  return { kind: 'function', id };
}
