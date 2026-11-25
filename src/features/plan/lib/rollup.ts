// Spec §12 money roll-ups that S7 and S8 need now. Module 6 adds function attribution, S9 and S10.
// Core rule 6: only money rolls up; quantities are never summed across services.

type Budgeted = { lineBudget: number | null; rows: readonly { budget: number | null }[] };

/** Line total: the sum of row budgets if any row has one; else the line budget; else 0. */
export function lineTotal(line: Budgeted): number {
  const rowBudgets = line.rows.flatMap((row) => (row.budget === null ? [] : [row.budget]));
  if (rowBudgets.length > 0) return rowBudgets.reduce((sum, budget) => sum + budget, 0);
  return line.lineBudget ?? 0;
}

/**
 * Spec §12 line attribution: a line budget on a line covering several functions is Shared and is
 * never split. A line left with no functions keeps its budget as Shared too (decision 2026-11-25).
 */
export function isShared(line: Budgeted): boolean {
  return (
    line.lineBudget !== null &&
    line.rows.every((row) => row.budget === null) &&
    line.rows.length !== 1
  );
}

/** Category planned (event) and event planned: sums of line totals. */
export function sumOfLines(lines: readonly Budgeted[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export type EnvelopeStatus =
  | { kind: 'none' }
  | { kind: 'left'; amount: number; share: number }
  | { kind: 'over'; amount: number };

/** Category left = envelope − planned; a negative value is over (spec §12). `share` is 0–1 for the meter. */
export function envelopeStatus(
  envelope: number | null | undefined,
  planned: number,
): EnvelopeStatus {
  if (envelope === null || envelope === undefined) return { kind: 'none' };
  const left = envelope - planned;
  if (left < 0) return { kind: 'over', amount: -left };
  return { kind: 'left', amount: left, share: envelope === 0 ? 1 : planned / envelope };
}
