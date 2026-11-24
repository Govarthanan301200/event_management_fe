import { formatINR } from '@/lib/format';
import { RATE_BASIS_LABEL, type RateBasis } from '../api/vendors.schema';

// Spec §9 "Rate suggestion" (used by the S8 service drawer in Module 5). Pure, never stored:
// core rule 7 says budgets are always typed by the planner, so this only *suggests* a figure.

/** One labelled measurement on a function row (spec §6 `quantities.size`). */
export type SizeMeasurement = {
  label: string;
  lengthFt: number | null;
  widthFt: number | null;
};

/** The quantities of one function row (spec §6 `function_row.quantities`). */
export type RowQuantities = {
  pax?: number | null;
  hours?: number | null;
  minutes?: number | null;
  size?: readonly SizeMeasurement[] | null;
};

export type VendorRate = { amount: number; basis: RateBasis };

export type RateSuggestion = {
  /** Whole rupees. */
  amount: number;
  /** The quantity the rate was multiplied by (1 for a package). */
  quantity: number;
  rate: VendorRate;
};

/** Sq ft of one row: the sum of length × width over measurements with both sides set. */
function rowArea(size: readonly SizeMeasurement[] | null | undefined): number {
  return (size ?? []).reduce(
    (area, m) =>
      m.lengthFt && m.widthFt && m.lengthFt > 0 && m.widthFt > 0
        ? area + m.lengthFt * m.widthFt
        : area,
    0,
  );
}

function rowQuantity(row: RowQuantities, basis: Exclude<RateBasis, 'package'>): number {
  if (basis === 'size') return rowArea(row.size);
  const value = row[basis];
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * "Rate suggests ₹X" where X = rate × quantity across the line's rows, or the package amount.
 * Returns null when there is no rate, or no quantity to multiply (nothing to suggest).
 * Decision 2026-11-24: a `size` rate is per sq ft of total area.
 */
export function rateSuggestion(
  rate: VendorRate | null | undefined,
  rows: readonly RowQuantities[],
): RateSuggestion | null {
  if (!rate || !Number.isInteger(rate.amount) || rate.amount < 0) return null;
  if (rate.basis === 'package') return { amount: rate.amount, quantity: 1, rate };

  const basis = rate.basis;
  const quantity = rows.reduce((total, row) => total + rowQuantity(row, basis), 0);
  if (quantity <= 0) return null;
  // Half hours and fractional areas can give paise; budgets are whole rupees.
  return { amount: Math.round(rate.amount * quantity), quantity, rate };
}

const UNIT: Record<Exclude<RateBasis, 'package'>, string> = {
  pax: 'pax',
  hours: 'hrs',
  minutes: 'min',
  size: 'sq ft',
};

/** "9 hrs × ₹8,000", or "Package ₹25,000": the explanation shown beside the suggestion. */
export function describeSuggestion(suggestion: RateSuggestion): string {
  const { rate, quantity } = suggestion;
  if (rate.basis === 'package') return `Package ${formatINR(rate.amount)}`;
  const amount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(quantity);
  return `${amount} ${UNIT[rate.basis]} × ${formatINR(rate.amount)}`;
}

/** "₹8,000 per hour", "₹25,000 package". */
export function formatRate(amount: number, basis: RateBasis): string {
  return `${formatINR(amount)} ${RATE_BASIS_LABEL[basis]}`;
}
