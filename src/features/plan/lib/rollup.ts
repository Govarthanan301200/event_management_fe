// The spec §12 roll-ups come from the server (GET /events/:id/summary, decision 2026-11-26).
// This copy of the line total stays only for S8's live total while the planner types.

type Budgeted = { lineBudget: number | null; rows: readonly { budget: number | null }[] };

/** Line total: the sum of row budgets if any row has one; else the line budget; else 0. */
export function lineTotal(line: Budgeted): number {
  const rowBudgets = line.rows.flatMap((row) => (row.budget === null ? [] : [row.budget]));
  if (rowBudgets.length > 0) return rowBudgets.reduce((sum, budget) => sum + budget, 0);
  return line.lineBudget ?? 0;
}
