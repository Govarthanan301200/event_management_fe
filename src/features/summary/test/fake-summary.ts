import type { EventMoneySummary } from '../api/summary.schema';

// Test-only stand-in for GET /events/:id/summary, so MSW backends answer from their in-memory
// plan. The real formulas live on the server (Backend/src/modules/summary/rollup.ts, unit-tested).

type FakeLine = {
  id: string;
  categoryId: string;
  lineBudget: number | null;
  rows: readonly { eventFunctionId: string; budget: number | null }[];
};

type FakeInput = {
  overallBudget: number | null;
  functions: readonly {
    id: string;
    name: string;
    date: string;
    startTime: string;
    guestCount: number;
  }[];
  categories: readonly { id: string; name: string }[];
  lines: readonly FakeLine[];
  envelopes: ReadonlyMap<string, number>;
};

export function fakeSummary(input: FakeInput): EventMoneySummary {
  const lines = input.lines.map((line) => {
    const budgeted = line.rows.filter((row) => row.budget !== null);
    const byFunction: Record<string, number> = {};
    let shared = 0;
    if (budgeted.length > 0) {
      for (const row of budgeted) byFunction[row.eventFunctionId] = row.budget ?? 0;
    } else if (line.lineBudget !== null) {
      const [only] = line.rows;
      if (line.rows.length === 1 && only) byFunction[only.eventFunctionId] = line.lineBudget;
      else shared = line.lineBudget;
    }
    const total = Object.values(byFunction).reduce((sum, n) => sum + n, 0) + shared;
    return { id: line.id, categoryId: line.categoryId, total, byFunction, shared };
  });
  const categories = input.categories.flatMap((category) => {
    const own = lines.filter((line) => line.categoryId === category.id);
    const envelope = input.envelopes.get(category.id) ?? null;
    if (own.length === 0 && envelope === null) return [];
    const byFunction: Record<string, number> = {};
    for (const line of own) {
      for (const [id, amount] of Object.entries(line.byFunction)) {
        byFunction[id] = (byFunction[id] ?? 0) + amount;
      }
    }
    const planned = own.reduce((sum, line) => sum + line.total, 0);
    const left = envelope === null ? null : envelope - planned;
    return [
      {
        id: category.id,
        name: category.name,
        byFunction,
        shared: own.reduce((sum, line) => sum + line.shared, 0),
        planned,
        envelope,
        left,
        over: left !== null && left < 0,
      },
    ];
  });
  const planned = lines.reduce((sum, line) => sum + line.total, 0);
  const left = input.overallBudget === null ? null : input.overallBudget - planned;
  const withEnvelope = categories.filter((c) => c.envelope !== null);
  return {
    overallBudget: input.overallBudget,
    planned,
    left,
    over: left !== null && left < 0,
    services: lines.length,
    categoriesOver: categories.filter((c) => c.over).length,
    categoriesWithEnvelope: withEnvelope.length,
    functions: input.functions.map((fn) => ({
      id: fn.id,
      name: fn.name,
      date: fn.date,
      startTime: fn.startTime,
      guestCount: fn.guestCount,
      total: lines.reduce((sum, line) => sum + (line.byFunction[fn.id] ?? 0), 0),
    })),
    shared: lines.reduce((sum, line) => sum + line.shared, 0),
    categories,
    envelopeTotal:
      withEnvelope.length === 0 ? null : withEnvelope.reduce((s, c) => s + (c.envelope ?? 0), 0),
    lines,
  };
}
